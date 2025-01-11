mod models;

use models::StoredUniverse;
use rowifi_roblox::{RobloxClient, UpdateDatastoreEntryArgs};
use rowifi_roblox_models::{
    datastore::{Datastore, DatastoreEntry},
    id::{UniverseId, UserId},
};
use serde::Serialize;
use serde_json::Value;
use std::collections::HashMap;
use tauri::{AppHandle, Manager, State};
use tauri_plugin_store::StoreExt;
use tokio::sync::Mutex;

#[derive(Serialize)]
pub struct InitInfo {
    pub token: bool,
}

pub struct Universes(Mutex<Vec<UniverseId>>);

#[derive(Clone)]
pub struct PageEntries {
    pub entries: Vec<String>,
    pub next_page_token: Option<String>,
}

pub struct DatastoreCache {
    pub universe_id: UniverseId,
    pub datastore_id: String,
    pub page_entries: HashMap<u32, PageEntries>,
    pub entries: HashMap<String, DatastoreEntry>,
}

#[tauri::command(rename_all = "snake_case")]
fn get_init_info(app: AppHandle) -> Result<InitInfo, String> {
    let store = app.store("store.json").map_err(|err| err.to_string())?;
    let token = store.has("roblox_token");

    Ok(InitInfo { token })
}

#[tauri::command(rename_all = "snake_case")]
fn set_token(app: AppHandle, token: String) -> Result<(), String> {
    let store = app.store("store.json").map_err(|err| err.to_string())?;
    store.set("roblox_token", token);
    store.save().map_err(|err| err.to_string())?;

    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
async fn add_universe(app: AppHandle, universe_ids: State<'_, Universes>, universe: UniverseId) -> Result<(), String> {
    let store = app.store("store.json").map_err(|err| err.to_string())?;
    let mut universes = universe_ids.inner().0.lock().await;
    universes.push(universe);

    store.set("universes", serde_json::to_value(universes.clone()).unwrap());
    store.save().map_err(|err| err.to_string())?;

    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
async fn get_universes(
    roblox: State<'_, RobloxClient>,
    universe_ids: State<'_, Universes>,
) -> Result<Vec<StoredUniverse>, String> {
    let mut universes = Vec::new();
    let universe_ids = universe_ids.inner().0.lock().await;
    for universe_id in universe_ids.iter() {
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
async fn list_datastores(
    roblox: State<'_, RobloxClient>,
    universe_id: UniverseId,
) -> Result<Vec<Datastore>, String> {
    let datastores = roblox
        .list_datastores(universe_id)
        .await
        .map_err(|err| err.to_string())?;

    Ok(datastores.data)
}

#[tauri::command(rename_all = "snake_case")]
async fn get_datastore_entries(
    roblox: State<'_, RobloxClient>,
    cache: State<'_, Mutex<DatastoreCache>>,
    universe_id: UniverseId,
    datastore_id: String,
    page: u32,
) -> Result<Vec<DatastoreEntry>, String> {
    log::trace!("get_datastore_entries");
    let mut res = Vec::new();
    let mut cache = cache.lock().await;

    if cache.universe_id != universe_id {
        cache.universe_id = universe_id;
        cache.page_entries.clear();
        cache.entries.clear();
    }
    if cache.datastore_id != datastore_id {
        cache.datastore_id = datastore_id.clone();
        cache.page_entries.clear();
        cache.entries.clear();
    }

    let entries = if let Some(page_entries) = cache.page_entries.get(&page) {
        page_entries.entries.clone()
    } else {
        let page_token = cache
            .page_entries
            .get(&(page - 1))
            .map(|data| data.next_page_token.clone())
            .flatten()
            .unwrap_or_default();
        log::trace!("{}", page_token);

        let page_entries = match roblox
            .list_datastore_entries(
                universe_id,
                &datastore_id,
                &urlencoding::encode(&page_token),
                25,
            )
            .await
        {
            Ok(e) => e,
            Err(err) => {
                log::warn!("{:?}", err);
                return Err(err.to_string());
            }
        };

        let page_entries = PageEntries {
            entries: page_entries.data.into_iter().map(|e| e.id).collect(),
            next_page_token: page_entries.next_page_token,
        };
        cache.page_entries.insert(page, page_entries.clone());

        page_entries.entries
    };

    for entry in &entries {
        log::trace!("fetching entry {}", entry);
        if let Some(cached_entry) = cache.entries.get(entry) {
            res.push(cached_entry.clone());
        } else {
            let entry = match roblox
                .get_datastore_entry(universe_id, &datastore_id, &entry, None)
                .await
            {
                Ok(entry) => entry,
                Err(err) => {
                    log::warn!("{:?}", err);
                    return Err(err.to_string());
                }
            };

            cache.entries.insert(entry.id.clone(), entry.clone());
            res.push(entry);
        }
    }

    Ok(res)
}

#[tauri::command(rename_all = "snake_case")]
async fn update_datastore_entry(
    roblox: State<'_, RobloxClient>,
    cache: State<'_, Mutex<DatastoreCache>>,
    entry_id: String,
    value: Value,
    users: Vec<UserId>,
    attributes: Option<Value>,
) -> Result<(), String> {
    log::trace!("update_datastore_entry");

    let value = serde_json::from_str::<Value>(&value.as_str().unwrap()).unwrap();
    let mut cache = cache.lock().await;
    let new_entry = roblox
        .update_datastore_entry(
            cache.universe_id,
            &cache.datastore_id,
            &entry_id,
            UpdateDatastoreEntryArgs {
                value,
                users,
                attributes,
            },
        )
        .await
        .map_err(|err| err.to_string())?;

    if let Some(cached_entry) = cache.entries.get_mut(&entry_id) {
        *cached_entry = new_entry.clone();
    }

    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
async fn delete_datastore_entry(
    roblox: State<'_, RobloxClient>,
    cache: State<'_, Mutex<DatastoreCache>>,
    page: u32,
    entry_id: String,
) -> Result<(), String> {
    let mut cache = cache.lock().await;
    roblox
        .delete_datastore_entry(cache.universe_id, &cache.datastore_id, &entry_id)
        .await
        .map_err(|err| err.to_string())?;
    if let Some(page_entries) = cache.page_entries.get_mut(&page) {
        page_entries.entries.retain(|e| *e != entry_id);
    }
    cache.entries.remove(&entry_id);

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_log::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            set_token,
            get_universes,
            add_universe,
            get_init_info,
            list_datastores,
            get_datastore_entries,
            update_datastore_entry,
            delete_datastore_entry
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
            app.manage(Universes(Mutex::new(universes)));

            app.manage(Mutex::new(DatastoreCache {
                universe_id: UniverseId(0),
                datastore_id: "".into(),
                page_entries: HashMap::new(),
                entries: HashMap::new(),
            }));

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
