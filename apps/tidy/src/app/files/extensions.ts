// #region LICENSE
//
// c/o: https://github.com/microsoft/fluentui/blob/7.0/packages/file-type-icons/src/FileTypeIconMap.ts
//
// Fluent UI React
//
// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the ""Software""), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
//  * The above copyright notice and this permission notice shall be included in
//    all copies or substantial portions of the Software.
//  * THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
//    THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
//    FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
//    DEALINGS IN THE SOFTWARE.
//
// #endregion LICENSE

/**
 * Enumeration of icon file names, and what extensions they map to. Please keep
 * items alphabetical. Items without extensions may require specific logic in
 * the code to map. Always use getFileTypeIconProps to get the most up-to-date
 * icon at the right pixel density.
 */
export default {
	accdb: ["accdb", "mdb"],
	archive: [
		"7z",
		"ace",
		"arc",
		"arj",
		"dmg",
		"gz",
		"iso",
		"lzh",
		"pkg",
		"rar",
		"sit",
		"tgz",
		"tar",
		"z",
	],
	audio: [
		"aif",
		"aiff",
		"aac",
		"alac",
		"amr",
		"ape",
		"au",
		"awb",
		"dct",
		"dss",
		"dvf",
		"flac",
		"gsm",
		"m4a",
		"m4p",
		"mid",
		"mmf",
		"mp3",
		"oga",
		"ra",
		"rm",
		"wav",
		"wma",
		"wv",
	],
	calendar: ["ical", "icalendar", "ics", "ifb", "vcs"],
	code: [
		"abap",
		"ada",
		"adp",
		"ahk",
		"as",
		"as3",
		"asc",
		"ascx",
		"asm",
		"asp",
		"awk",
		"bash",
		"bash_login",
		"bash_logout",
		"bash_profile",
		"bashrc",
		"bat",
		"bib",
		"bsh",
		"build",
		"builder",
		"c",
		"cbl",
		"c++",
		"capfile",
		"cc",
		"cfc",
		"cfm",
		"cfml",
		"cl",
		"clj",
		"cls",
		"cmake",
		"cmd",
		"coffee",
		"config",
		"cpp",
		"cpt",
		"cpy",
		"cs",
		"cshtml",
		"cson",
		"csproj",
		"css",
		"ctp",
		"cxx",
		"d",
		"ddl",
		"di",
		"disco",
		"dml",
		"dtd",
		"dtml",
		"el",
		"emakefile",
		"erb",
		"erl",
		"f",
		"f90",
		"f95",
		"fs",
		"fsi",
		"fsscript",
		"fsx",
		"gemfile",
		"gemspec",
		"gitconfig",
		"go",
		"groovy",
		"gvy",
		"h",
		"h++",
		"haml",
		"handlebars",
		"hbs",
		"hcp",
		"hh",
		"hpp",
		"hrl",
		"hs",
		"htc",
		"hxx",
		"idl",
		"iim",
		"inc",
		"inf",
		"ini",
		"inl",
		"ipp",
		"irbrc",
		"jade",
		"jav",
		"java",
		"js",
		"json",
		"jsp",
		"jsproj",
		"jsx",
		"l",
		"less",
		"lhs",
		"lisp",
		"log",
		"lst",
		"ltx",
		"lua",
		"m",
		"mak",
		"make",
		"manifest",
		"master",
		"md",
		"markdn",
		"markdown",
		"mdown",
		"mkdn",
		"ml",
		"mli",
		"mll",
		"mly",
		"mm",
		"mud",
		"nfo",
		"opml",
		"osascript",
		"p",
		"pas",
		"patch",
		"php",
		"php2",
		"php3",
		"php4",
		"php5",
		"phtml",
		"pl",
		"pm",
		"pod",
		"pp",
		"profile",
		"ps1",
		"ps1xml",
		"psd1",
		"psm1",
		"pss",
		"pt",
		"py",
		"pyw",
		"r",
		"rake",
		"rb",
		"rbx",
		"rc",
		"rdf",
		"re",
		"reg",
		"rest",
		"resw",
		"resx",
		"rhtml",
		"rjs",
		"rprofile",
		"rpy",
		"rss",
		"rst",
		"ruby",
		"rxml",
		"s",
		"sass",
		"scala",
		"scm",
		"sconscript",
		"sconstruct",
		"script",
		"scss",
		"sgml",
		"sh",
		"shtml",
		"sml",
		"svn-base",
		"swift",
		"sql",
		"sty",
		"tcl",
		"tex",
		"textile",
		"tld",
		"tli",
		"tmpl",
		"tpl",
		"vb",
		"vi",
		"vim",
		"vmg",
		"webpart",
		"wsp",
		"wsdl",
		"xhtml",
		"xoml",
		"xsd",
		"xslt",
		"yaml",
		"yaws",
		"yml",
		"zsh",
	],
	contact: ["vcf"],
	csv: ["csv"],
	docx: ["doc", "docm", "docx", "docb"],
	dotx: ["dot", "dotm", "dotx"],
	email: ["eml", "msg", "ost", "pst"],
	exe: [
		"application",
		"appref-ms",
		"apk",
		"app",
		"appx",
		"exe",
		"ipa",
		"msi",
		"xap",
	],
	folder: ["folder"],
	font: ["ttf", "otf", "woff"],
	fluid: ["b", "fluid"],
	genericfile: [],
	html: ["htm", "html", "mht"],
	link: ["lnk", "link", "url", "website", "webloc"],
	officescript: ["osts"],
	splist: ["listitem"],
	model: [
		"3ds",
		"3mf",
		"blend",
		"cool",
		"dae",
		"df",
		"dwfx",
		"dwg",
		"dxf",
		"fbx",
		"glb",
		"gltf",
		"holo",
		"layer",
		"layout",
		"max",
		"mcworld",
		"mtl",
		"obj",
		"off",
		"ply",
		"skp",
		"stp",
		"stl",
		"t",
		"thl",
		"x",
	],
	mpp: ["mpp"],
	mpt: ["mpt"],
	one: ["note", "one"],
	onetoc: ["ms-one-stub", "onetoc", "onetoc2", "onepkg"],
	pdf: ["pdf"],
	photo: [
		"arw",
		"bmp",
		"cr2",
		"crw",
		"dic",
		"dicm",
		"dcm",
		"dcm30",
		"dcr",
		"dds",
		"dib",
		"dng",
		"erf",
		"gif",
		"heic",
		"heif",
		"ico",
		"jfi",
		"jfif",
		"jif",
		"jpe",
		"jpeg",
		"jpg",
		"kdc",
		"mrw",
		"nef",
		"orf",
		"pct",
		"pict",
		"png",
		"pns",
		"psb",
		"psd",
		"raw",
		"tga",
		"tif",
		"tiff",
		"wdp",
	],
	potx: ["pot", "potm", "potx"],
	powerbi: ["pbids", "pbix"],
	ppsx: ["pps", "ppsm", "ppsx"],
	pptx: ["ppt", "pptm", "pptx", "sldx", "sldm"],
	presentation: ["odp", "gslides", "key"],
	pub: ["pub"],
	spo: ["aspx", "classifier"],
	sponews: [],
	spreadsheet: ["odc", "ods", "gsheet", "numbers", "tsv"],
	stream: [],
	rtf: ["epub", "gdoc", "odt", "rtf", "wri", "pages"],
	sysfile: [
		"bak",
		"bin",
		"cab",
		"cache",
		"cat",
		"cer",
		"class",
		"dat",
		"db",
		"dbg",
		"dl_",
		"dll",
		"ithmb",
		"jar",
		"kb",
		"ldt",
		"lrprev",
		"pkpass",
		"ppa",
		"ppam",
		"pdb",
		"rom",
		"thm",
		"thmx",
		"vsl",
		"xla",
		"xlam",
		"xlb",
		"xll",
	],
	txt: ["dif", "diff", "readme", "out", "plist", "properties", "text", "txt"],
	vector: [
		"ai",
		"ait",
		"cvs",
		"dgn",
		"gdraw",
		"pd",
		"emf",
		"eps",
		"fig",
		"ind",
		"indd",
		"indl",
		"indt",
		"indb",
		"ps",
		"svg",
		"svgz",
		"wmf",
		"oxps",
		"xps",
		"xd",
		"sketch",
	],
	video: [
		"3g2",
		"3gp",
		"3gp2",
		"3gpp",
		"asf",
		"avi",
		"dvr-ms",
		"flv",
		"m1v",
		"m4v",
		"mkv",
		"mod",
		"mov",
		"mm4p",
		"mp2",
		"mp2v",
		"mp4",
		"mp4v",
		"mpa",
		"mpe",
		"mpeg",
		"mpg",
		"mpv",
		"mpv2",
		"mts",
		"ogg",
		"qt",
		"swf",
		"ts",
		"vob",
		"webm",
		"wlmp",
		"wm",
		"wmv",
		"wmx",
	],
	vsdx: ["vdx", "vsd", "vsdm", "vsdx", "vsw", "vdw"],
	vssx: ["vss", "vssm", "vssx"],
	vstx: ["vst", "vstm", "vstx", "vsx"],
	whiteboard: ["whiteboard"],
	xlsx: ["xlc", "xls", "xlsb", "xlsm", "xlsx", "xlw"],
	xltx: ["xlt", "xltm", "xltx"],
	xml: ["xaml", "xml", "xsl"],
	xsn: ["xsn"],
	zip: ["zip"],
} as const;
