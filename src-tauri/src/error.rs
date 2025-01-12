use rowifi_roblox::error::{ErrorKind as RobloxErrorKind, RobloxError};
use serde::Serialize;
use serde_repr::Serialize_repr;
use tauri::http::StatusCode;

#[derive(Debug, Serialize)]
pub struct Error {
    pub kind: ErrorKind,
}

#[derive(Clone, Copy, Debug, Serialize_repr)]
#[repr(u8)]
pub enum ErrorKind {
    NotFound,
    Forbidden,
    RobloxServer,
    Unknown,
}

impl From<RobloxError> for Error {
    fn from(err: RobloxError) -> Self {
        match err.kind() {
            RobloxErrorKind::Response {
                route: _,
                status,
                bytes: _,
            } => {
                if *status == StatusCode::NOT_FOUND {
                    Error {
                        kind: ErrorKind::NotFound,
                    }
                } else if *status == StatusCode::FORBIDDEN {
                    Error {
                        kind: ErrorKind::Forbidden,
                    }
                } else if status.is_server_error() {
                    Error {
                        kind: ErrorKind::RobloxServer,
                    }
                } else {
                    Error {
                        kind: ErrorKind::Unknown,
                    }
                }
            }
            _ => Error {
                kind: ErrorKind::Unknown,
            },
        }
    }
}
