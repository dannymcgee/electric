#![cfg_attr(
	all(not(debug_assertions), target_os = "windows"),
	windows_subsystem = "windows"
)]

use std::{
	fmt::Display,
	fs::{self, File},
	path::PathBuf,
};

use tauri::AppHandle;
use zip::ZipArchive;

fn main() {
	tauri::Builder::default()
		.invoke_handler(tauri::generate_handler![import_book, is_directory])
		.run(tauri::generate_context!())
		.expect("error while running tauri application");
}

#[tauri::command]
fn import_book(app: AppHandle, path: PathBuf) -> Result<PathBuf, String> {
	let file = File::open(&path).map_err(with_ctx(format!(
		"Failed to open file '{}'",
		path.display()
	)))?;

	let book_name = path.file_stem().expect("Failed to extract filename");
	let dest_directory = app
		.path_resolver()
		.app_dir()
		.expect("Failed to get app directory")
		.join(book_name);

	if dest_directory.exists() {
		return Ok(dest_directory);
	}

	fs::create_dir_all(&dest_directory).map_err(with_ctx(format!(
		"Failed to create destination '{}'",
		dest_directory.display()
	)))?;

	let mut archive = ZipArchive::new(file).map_err(with_ctx(format!(
		"Failed to read archive '{}'",
		path.display()
	)))?;

	match archive.extract(&dest_directory) {
		Ok(_) => Ok(dest_directory),
		Err(err) => Err(format!("Failed to extract EPUB archive: {}", err)),
	}
}

#[tauri::command]
fn is_directory(path: PathBuf) -> bool {
	path.exists() && path.is_dir()
}

fn with_ctx<D: Display>(context: String) -> impl FnOnce(D) -> String {
	move |value: D| format!("{}: {}", context, value)
}
