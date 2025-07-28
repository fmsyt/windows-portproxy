use std::ptr;
use tauri::Manager;
use winapi::um::errhandlingapi::GetLastError;
use winapi::um::processthreadsapi::OpenProcessToken;
use winapi::um::securitybaseapi::GetTokenInformation;
use winapi::um::winnt::{TokenElevation, HANDLE, TOKEN_ELEVATION, TOKEN_QUERY};

#[tauri::command]
#[cfg(target_os = "windows")]
fn is_elevated() -> bool {
    unsafe {
        let mut token_handle: HANDLE = ptr::null_mut();
        let process_handle = winapi::um::processthreadsapi::GetCurrentProcess();

        // プロセストークンを取得
        if OpenProcessToken(process_handle, TOKEN_QUERY, &mut token_handle) == 0 {
            eprintln!("OpenProcessToken failed: {}", GetLastError());
            return false;
        }

        let mut elevation = TOKEN_ELEVATION { TokenIsElevated: 0 };
        let mut ret_len: u32 = 0;

        // TokenElevation 情報を取得
        if GetTokenInformation(
            token_handle,
            TokenElevation,
            &mut elevation as *mut _ as *mut _,
            std::mem::size_of::<TOKEN_ELEVATION>() as u32,
            &mut ret_len,
        ) == 0
        {
            eprintln!("GetTokenInformation failed: {}", GetLastError());
            return false;
        }

        // elevation.TokenIsElevated が 0 でなければ管理者
        elevation.TokenIsElevated != 0
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            #[cfg(not(target_os = "windows"))]
            {
                error!("This application is only supported on Windows.");
                app.exit(1);
            }

            #[cfg(target_os = "windows")]
            {
                let _ = app
                    .get_webview_window("main")
                    .expect("no main window found")
                    .set_focus();
            }
        }))
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![is_elevated])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
