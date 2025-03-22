#![cfg_attr(
	all(not(debug_assertions), target_os = "windows"),
	windows_subsystem = "windows"
)]

use std::{
	path::Path,
	process::{Command, Output},
};

fn main() {
	tauri::Builder::default()
		.plugin(tauri_plugin_http::init())
		.plugin(tauri_plugin_fs::init())
		.plugin(tauri_plugin_global_shortcut::Builder::new().build())
		.plugin(tauri_plugin_dialog::init())
		.plugin(tauri_plugin_shell::init())
		.plugin(tauri_plugin_clipboard_manager::init())
		.plugin(tauri_plugin_process::init())
		.plugin(tauri_plugin_os::init())
		.plugin(tauri_plugin_notification::init())
		.invoke_handler(tauri::generate_handler![parse_font_to_xml, path_exists])
		.run(tauri::generate_context!())
		.expect("error while running tauri application");
}

#[tauri::command]
fn parse_font_to_xml(font_path: String) -> Result<String, String> {
	match Command::new("ttx").args(["-o", "-", &font_path]).output() {
		Ok(Output { stdout, stderr, .. }) => match (stdout.len(), stderr.len()) {
			(1.., _) => match String::from_utf8(stdout.clone()) {
				Err(_) => Ok(String::from_utf8_lossy(&stdout).into()),
				Ok(result) => Ok(result),
			},
			(0, 1..) => match String::from_utf8(stderr) {
				Ok(err_msg) => Err(err_msg),
				Err(utf8_err) => Err(format!("{}", utf8_err)),
			},
			(0, 0) => Err("ttx produced no output..??".into()),
		},
		Err(err) => Err(format!("{}", err)),
	}
}

#[tauri::command]
fn path_exists(pathname: String) -> bool {
	Path::new(&pathname).exists()
}
