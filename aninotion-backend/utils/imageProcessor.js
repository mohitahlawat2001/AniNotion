const { v2: cloudinary } = require('cloudinary');
const axios = require('axios');

// Helper function to download file from URL
const downloadFile = async (url) => {
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'arraybuffer',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    timeout: 10000 // 10 second timeout
  });
  return Buffer.from(response.data, 'binary');
};

// Helper function to process images based on type
const processImages = async (images, imageTypes) => {
  const processedImages = [];
  
  for (let i = 0; i < images.length; i++) {
    try {
      let uploadResult;
      
      if (imageTypes[i]) {
        // It's a URL, download and upload to Cloudinary
        const buffer = await downloadFile(images[i]);
        
        uploadResult = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream({
            folder: 'aninotion-posts',
            public_id: `post_${Date.now()}_${i}`,
            resource_type: 'auto'
          }, (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }).end(buffer);
        });
      } else {
        // It's base64, upload directly to Cloudinary
        uploadResult = await cloudinary.uploader.upload(images[i], {
          folder: 'aninotion-posts',
          public_id: `post_${Date.now()}_${i}`,
          resource_type: 'auto'
        });
      }
      
      // Return optimized URL for both cases
      const optimizedUrl = cloudinary.url(uploadResult.public_id, {
        fetch_format: 'auto',
        quality: 'auto',
        width: 800,
        height: 600,
        crop: 'limit'
      });
      
      processedImages.push(optimizedUrl);
    } catch (uploadError) {
      throw new Error(`Failed to process image ${i + 1}: ${uploadError.message}`);
    }
  }
  
  return processedImages;
};

module.exports = {
  processImages,
  downloadFile
};