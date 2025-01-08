mod models;

use models::StoredUniverse;
use rowifi_roblox::RobloxClient;
use rowifi_roblox_models::{
    datastore::{Datastore, PartialDatastoreEntry},
    id::UniverseId,
};
use serde::Serialize;
use std::collections::HashMap;
use tauri::{AppHandle, Manager, State};
use tauri_plugin_store::StoreExt;
use tokio::sync::Mutex;

#[derive(Serialize)]
pub struct InitInfo {
    pub token: bool,
}

pub struct Universes(Vec<UniverseId>);

#[derive(Clone)]
pub struct PaginatedResponse<T> {
    pub data: Vec<T>,
    pub next_page_token: Option<String>,
}

pub struct DatastoreCache {
    pub universe_id: UniverseId,
    pub datastore_id: String,
    pub entries: HashMap<u32, PaginatedResponse<PartialDatastoreEntry>>,
}

#[tauri::command(rename_all = "snake_case")]
fn get_init_info(app: AppHandle) -> Result<InitInfo, String> {
    let store = app.store("store.json").map_err(|err| err.to_string())?;
    let token = store.has("roblox_token");

    Ok(InitInfo { token })
}

#[tauri::command(rename_all = "snake_case")]
async fn get_universes(
    roblox: State<'_, RobloxClient>,
    universe_ids: State<'_, Universes>,
) -> Result<Vec<StoredUniverse>, String> {
    let mut universes = Vec::new();
    for universe_id in &universe_ids.0 {
        let universe = roblox
            .get_universe(*universe_id)
            .await
            .map_err(|err| err.to_string())?;
        universes.push(StoredUniverse {
            id: *universe_id,
            name: universe.display_name,
        });
    }

    Ok(universes)
}

#[tauri::command(rename_all = "snake_case")]
async fn list_data_stores(
    roblox: State<'_, RobloxClient>,
    universe_id: UniverseId,
) -> Result<Vec<Datastore>, String> {
    let datastores = roblox
        .list_data_stores(universe_id)
        .await
        .map_err(|err| err.to_string())?;

    Ok(datastores.data)
}

#[tauri::command(rename_all = "snake_case")]
async fn list_data_store_entries(
    roblox: State<'_, RobloxClient>,
    cache: State<'_, Mutex<DatastoreCache>>,
    universe_id: UniverseId,
    datastore_id: String,
    page: u32,
) -> Result<Vec<PartialDatastoreEntry>, String> {
    log::trace!("list_data_store_entries");
    let mut cache = cache.lock().await;

    if cache.universe_id != universe_id {
        cache.universe_id = universe_id;
        cache.entries.clear();
    }
    if cache.datastore_id != datastore_id {
        cache.datastore_id = datastore_id.clone();
        cache.entries.clear();
    }

    if let Some(entries) = cache.entries.get(&page) {
        return Ok(entries.data.clone());
    }

    let page_token = cache
        .entries
        .get(&(page - 1))
        .map(|data| data.next_page_token.clone())
        .flatten()
        .unwrap_or_default();
    log::trace!("{}", page_token);

    let entries = match roblox
        .list_data_store_entries(universe_id, &datastore_id, &urlencoding::encode(&page_token), 25)
        .await
    {
        Ok(e) => e,
        Err(err) => {
            log::warn!("{:?}", err);
            return Err(err.to_string());
        }
    };
    log::trace!("{:?}", entries);

    cache.entries.insert(
        page,
        PaginatedResponse {
            data: entries.data.clone(),
            next_page_token: entries.next_page_token,
        },
    );

    Ok(entries.data)
}

#[tauri::command(rename_all = "snake_case")]
async fn get_data_store_entries(
    roblox: State<'_, RobloxClient>,
    cache: State<'_, Mutex<DatastoreCache>>,
    universe_id: UniverseId,
    datastore_id: String,
    page: u32,
) -> Result<Vec<PartialDatastoreEntry>, String> {
    log::trace!("get_data_store_entries");
    let mut res = Vec::new();
    let mut cache = cache.lock().await;
    if let Some(entries) = cache.entries.get_mut(&page) {
        for cached_entry in &mut entries.data {
            if cached_entry.value.is_some() {
                res.push(cached_entry.clone());
            } else {
                let entry = match roblox
                    .get_data_store_entry(universe_id, &datastore_id, &cached_entry.id, None)
                    .await
                {
                    Ok(entry) => entry,
                    Err(err) => {
                        log::warn!("{:?}", err);
                        return Err(err.to_string());
                    }
                };

                cached_entry.attributes = Some(entry.attributes);
                cached_entry.create_time = Some(entry.create_time);
                cached_entry.etag = Some(entry.etag);
                cached_entry.revision_create_time = Some(entry.revision_create_time);
                cached_entry.revision_id = Some(entry.revision_id);
                cached_entry.state = Some(entry.state);
                cached_entry.users = Some(entry.users);
                cached_entry.value = Some(entry.value);

                res.push(cached_entry.clone());
            }
        }
    }

    Ok(res)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_log::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            get_universes,
            get_init_info,
            list_data_stores,
            list_data_store_entries,
            get_data_store_entries
        ])
        .setup(|app| {
            let store = app.store("store.json")?;

            let token = store.get("roblox_token").unwrap_or_default();
            let token = token.as_str().unwrap_or_default();
            app.manage(RobloxClient::new(token, None));

            let universes = store.get("universes");
            let universes = universes
                .map(|value| serde_json::from_value::<Vec<UniverseId>>(value))
                .transpose()
                .map_err(|err| err.to_string())?
                .unwrap_or_default();
            app.manage(Universes(universes));

            app.manage(Mutex::new(DatastoreCache {
                universe_id: UniverseId(0),
                datastore_id: "".into(),
                entries: HashMap::new(),
            }));

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
