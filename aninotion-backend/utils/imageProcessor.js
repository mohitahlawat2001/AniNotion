const { v2: cloudinary } = require('cloudinary');
const axios = require('axios');
const logger = require('../config/logger');

// Helper function to download file from URL
const downloadFile = async (url) => {
  logger.info("⬇️ Downloading image from URL", { url: url.substring(0, 100) + "..." });
  
  try {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000 // 10 second timeout
    });
    
    logger.info("✅ Image downloaded successfully", {
      size: response.data.byteLength,
      contentType: response.headers['content-type']
    });
    
    return Buffer.from(response.data, 'binary');
  } catch (error) {
    logger.error("❌ Failed to download image:", {
      url: url.substring(0, 100) + "...",
      error: error.message
    });
    throw error;
  }
};

// Helper function to process images based on type
const processImages = async (images, imageTypes) => {
  logger.info("🖼️ Starting image processing", {
    totalImages: images.length,
    imageTypes: imageTypes.map((type, i) => ({ index: i, isUrl: type }))
  });

  const processedImages = [];
  
  for (let i = 0; i < images.length; i++) {
    try {
      logger.info(`📸 Processing image ${i + 1}/${images.length}`, {
        index: i,
        isUrl: imageTypes[i]
      });

      let uploadResult;
      
      if (imageTypes[i]) {
        // It's a URL, download and upload to Cloudinary
        logger.info("🌐 Processing URL image", { index: i });
        const buffer = await downloadFile(images[i]);
        
        uploadResult = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream({
            folder: 'aninotion-posts',
            public_id: `post_${Date.now()}_${i}`,
            resource_type: 'auto'
          }, (error, result) => {
            if (error) {
              logger.error("❌ Cloudinary upload failed for URL image:", {
                index: i,
                error: error.message
              });
              reject(error);
            } else {
              logger.info("✅ URL image uploaded to Cloudinary", {
                index: i,
                publicId: result.public_id,
                url: result.secure_url
              });
              resolve(result);
            }
          }).end(buffer);
        });
      } else {
        // It's base64, upload directly to Cloudinary
        logger.info("📄 Processing base64 image", { index: i });
        
        uploadResult = await cloudinary.uploader.upload(images[i], {
          folder: 'aninotion-posts',
          public_id: `post_${Date.now()}_${i}`,
          resource_type: 'auto'
        });
        
        logger.info("✅ Base64 image uploaded to Cloudinary", {
          index: i,
          publicId: uploadResult.public_id,
          url: uploadResult.secure_url
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
      
      logger.info("🎨 Image optimized and added to collection", {
        index: i,
        optimizedUrl: optimizedUrl.substring(0, 100) + "..."
      });
    } catch (uploadError) {
      logger.error("❌ Image processing failed:", {
        index: i,
        error: uploadError.message,
        stack: uploadError.stack
      });
      
      throw new Error(`Failed to process image ${i + 1}: ${uploadError.message}`);
    }
  }
  
  logger.info("✅ All images processed successfully", {
    totalProcessed: processedImages.length,
    originalCount: images.length
  });
  
  return processedImages;
};

module.exports = {
  processImages,
  downloadFile
};