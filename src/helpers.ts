

// function getBibliography(app, file, settings) {
//   const metadata = app.metadataCache.getFileCache(file);
//   if ((_a = metadata == null ? void 0 : metadata.frontmatter) == null ? void 0 : _a.bibliography) {
// 	return metadata.frontmatter.bibliography;
//   }
//   return settings.pathToBibliography;
// }
//
// function getCSLStyle(app, file, settings) {
//   const metadata = app.metadataCache.getFileCache(file);
//   if (!(metadata == null ? void 0 : metadata.frontmatter)) {
// 	return settings.cslStyle;
//   }
//   if (metadata.frontmatter.csl) {
// 	return metadata.frontmatter.csl;
//   }
//   if (metadata.frontmatter["citation-style"]) {
// 	return metadata.frontmatter.csl;
//   }
//   return settings.cslStyle;
// }

// export { getBibliography, getCSLStyle }
