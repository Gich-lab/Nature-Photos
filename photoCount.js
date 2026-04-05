async function getImageFolderFileCount() {
  const folderPath = 'images'; // folder in the repo
  const apiUrl = `https://api.github.com/repos/Gich-lab/Nature-Photos/contents/${folderPath}`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (Array.isArray(data)) {
      const fileCount = data.length;
      console.log(`Number of files in "images" folder:`, fileCount);
    } else {
      console.log('Folder not found or is empty');
    }
  } catch (error) {
    console.error('Error fetching folder contents:', error);
  }
}

getImageFolderFileCount();