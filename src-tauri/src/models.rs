use rowifi_roblox_models::id::UniverseId;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct StoredUniverse {
    pub id: UniverseId,
    pub name: String
}