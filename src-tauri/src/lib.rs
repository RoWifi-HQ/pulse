mod error;
mod models;

use error::Error;
use models::StoredUniverse;
use rowifi_roblox::{PaginatedResponse, RobloxClient, UpdateDatastoreEntryArgs};
use rowifi_roblox_models::{
    datastore::{Datastore, DatastoreEntry, PartialDatastoreEntry},
    id::{UniverseId, UserId},
};
use serde::Serialize;
use serde_json::Value;
use tauri::{AppHandle, Manager, State};
use tauri_plugin_log::{Target, TargetKind};
use tauri_plugin_store::StoreExt;
use tokio::sync::Mutex;
use keyring::Entry;

#[derive(Serialize)]
pub struct InitInfo {
    pub token: bool,
}

pub struct Universes(Mutex<Vec<UniverseId>>);

#[tauri::command(rename_all = "snake_case")]
fn get_init_info() -> Result<InitInfo, String> {
    let entry = Entry::new("pulse", "roblox_token").map_err(|err| err.to_string())?;
    let token = entry.get_password().is_ok();

    Ok(InitInfo { token })
}

#[tauri::command(rename_all = "snake_case")]
fn set_token(app: AppHandle, token: String) -> Result<(), String> {
    let entry = Entry::new("pulse", "roblox_token").map_err(|err| err.to_string())?;
    entry.set_password(&token).map_err(|err| err.to_string())?;

    app.manage(RobloxClient::new(&token, None));

    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
async fn add_universe(
    app: AppHandle,
    universe_ids: State<'_, Universes>,
    universe: UniverseId,
) -> Result<(), String> {
    log::trace!("add_universe");
    let store = app.store("store.json").map_err(|err| err.to_string())?;
    let mut universes = universe_ids.inner().0.lock().await;
    universes.push(universe);

    store.set(
        "universes",
        serde_json::to_value(universes.clone()).unwrap(),
    );
    store.save().map_err(|err| err.to_string())?;
    log::debug!("new universes: {:?}", universes);

    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
async fn get_universes(
    roblox: State<'_, RobloxClient>,
    universe_ids: State<'_, Universes>,
) -> Result<Vec<StoredUniverse>, Error> {
    log::trace!("get_universes");
    let mut universes = Vec::new();
    let universe_ids = universe_ids.inner().0.lock().await;
    log::debug!("universe ids: {:?}", universe_ids);
    for universe_id in universe_ids.iter() {
        let universe = match roblox.get_universe(*universe_id).await {
            Ok(u) => u,
            Err(err) => {
                log::error!("{err:?}");
                continue;
            }
        };
        universes.push(StoredUniverse {
            id: *universe_id,
            name: universe.display_name,
        });
    }
    log::debug!("universes: {:?}", universes);

    Ok(universes)
}

#[tauri::command(rename_all = "snake_case")]
async fn list_datastores(
    roblox: State<'_, RobloxClient>,
    universe_id: UniverseId,
) -> Result<Vec<Datastore>, Error> {
    let datastores = roblox.list_datastores(universe_id).await?;

    Ok(datastores.data)
}

#[tauri::command(rename_all = "snake_case")]
async fn list_datastore_entries(
    roblox: State<'_, RobloxClient>,
    universe_id: UniverseId,
    datastore_id: String,
    filter: Option<String>,
    page_token: Option<String>,
) -> Result<PaginatedResponse<PartialDatastoreEntry>, Error> {
    log::trace!("list_datastore_entries");

    let page_entries = match roblox
        .list_datastore_entries(
            universe_id,
            &datastore_id,
            &urlencoding::encode(&page_token.unwrap_or_default()),
            25,
            filter.as_deref(),
        )
        .await
    {
        Ok(e) => e,
        Err(err) => {
            log::error!("{:?}", err);
            return Err(err.into());
        }
    };

    Ok(page_entries)
}

#[tauri::command(rename_all = "snake_case")]
async fn list_datastore_entry_revisions(
    roblox: State<'_, RobloxClient>,
    universe_id: UniverseId,
    datastore_id: String,
    entry_id: String,
    page_token: Option<String>,
) -> Result<PaginatedResponse<PartialDatastoreEntry>, Error> {
    log::trace!("list_datastore_entry_revisions");

    let page_revisions = match roblox
        .list_datastore_entry_revisions(
            universe_id,
            &datastore_id,
            &entry_id,
            &urlencoding::encode(&page_token.unwrap_or_default()),
            25,
        )
        .await
    {
        Ok(e) => e,
        Err(err) => {
            log::error!("{:?}", err);
            return Err(err.into());
        }
    };

    Ok(page_revisions)
}

#[tauri::command(rename_all = "snake_case")]
async fn get_datastore_entry(
    roblox: State<'_, RobloxClient>,
    universe_id: UniverseId,
    datastore_id: String,
    entry_id: String,
    revision_id: Option<String>,
) -> Result<DatastoreEntry, Error> {
    log::trace!("get_datastore_entry");
    let entry = match roblox
        .get_datastore_entry(
            universe_id,
            &datastore_id,
            &entry_id,
            revision_id.as_deref(),
        )
        .await
    {
        Ok(entry) => entry,
        Err(err) => {
            log::warn!("{:?}", err);
            return Err(err.into());
        }
    };

    Ok(entry)
}

#[tauri::command(rename_all = "snake_case")]
async fn update_datastore_entry(
    roblox: State<'_, RobloxClient>,
    universe_id: UniverseId,
    datastore_id: String,
    entry_id: String,
    value: Value,
    users: Vec<UserId>,
    attributes: Option<Value>,
) -> Result<DatastoreEntry, Error> {
    log::trace!("update_datastore_entry");

    let new_entry = match roblox
        .update_datastore_entry(
            universe_id,
            &datastore_id,
            &entry_id,
            UpdateDatastoreEntryArgs {
                value,
                users,
                attributes,
            },
        )
        .await
    {
        Ok(entry) => entry,
        Err(err) => {
            log::error!("{:?}", err);
            return Err(err.into());
        }
    };

    Ok(new_entry)
}

#[tauri::command(rename_all = "snake_case")]
async fn delete_datastore_entry(
    roblox: State<'_, RobloxClient>,
    universe_id: UniverseId,
    datastore_id: String,
    entry_id: String,
) -> Result<(), Error> {
    if let Err(err) = roblox
        .delete_datastore_entry(universe_id, &datastore_id, &entry_id)
        .await
    {
        log::error!("{:?}", err);
        return Err(err.into());
    };

    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
async fn create_datastore_entry(
    roblox: State<'_, RobloxClient>,
    universe_id: UniverseId,
    datastore_id: String,
    entry_id: String,
    value: Value,
    users: Vec<UserId>,
    attributes: Option<Value>,
) -> Result<(), Error> {
    log::trace!("create_datastore_entry");

    if let Err(err) = roblox
        .create_datastore_entry(
            universe_id,
            &datastore_id,
            &entry_id,
            UpdateDatastoreEntryArgs {
                value,
                users,
                attributes,
            },
        )
        .await
    {
        log::error!("{:?}", err);
        return Err(err.into());
    };
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(
            tauri_plugin_log::Builder::new()
                .target(Target::new(TargetKind::LogDir {
                    file_name: Some("logs".to_string()),
                }))
                .max_file_size(5000000)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            set_token,
            get_universes,
            add_universe,
            get_init_info,
            list_datastores,
            list_datastore_entries,
            get_datastore_entry,
            update_datastore_entry,
            delete_datastore_entry,
            list_datastore_entry_revisions,
            create_datastore_entry
        ])
        .setup(|app| {
            if let Ok(entry) = Entry::new("pulse", "roblox_token") {
                if let Ok(token) = entry.get_password() {
                    app.manage(RobloxClient::new(&token, None));
                }
            }

            let store = app.store("store.json")?;
            let universes = store.get("universes");
            let universes = universes
                .map(|value| serde_json::from_value::<Vec<UniverseId>>(value))
                .transpose()
                .map_err(|err| err.to_string())?
                .unwrap_or_default();
            app.manage(Universes(Mutex::new(universes)));

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
