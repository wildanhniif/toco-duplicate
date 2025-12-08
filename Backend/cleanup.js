// cleanup.js - Cleanup unused files and folders
const fs = require("fs");
const path = require("path");

console.log("🧹 Starting cleanup process...\n");

// Folders to remove (old upload folders)
const foldersToRemove = [
  "uploads/products",
  "uploads/stores",
  "uploads/about_thumbnails",
  "uploads",
];

// Function to remove directory recursively
function removeDirectory(dirPath) {
  if (fs.existsSync(dirPath)) {
    const files = fs.readdirSync(dirPath);

    files.forEach((file) => {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        removeDirectory(filePath);
      } else {
        fs.unlinkSync(filePath);
        console.log(`   ✓ Deleted file: ${filePath}`);
      }
    });

    fs.rmdirSync(dirPath);
    console.log(`   ✓ Deleted folder: ${dirPath}\n`);
    return true;
  }
  return false;
}

// Remove old upload folders
console.log("📁 Removing old upload folders...");
foldersToRemove.forEach((folder) => {
  const folderPath = path.join(__dirname, folder);
  if (removeDirectory(folderPath)) {
    console.log(`✅ Removed: ${folder}`);
  } else {
    console.log(`⏭️  Skipped (not found): ${folder}`);
  }
});

console.log("\n✨ Cleanup complete!");
console.log("\n📝 Next steps:");
console.log("1. Run the SQL cleanup script in your database");
console.log("2. Restart your backend server");
console.log("3. Upload new images - they will go to Cloudinary automatically");
