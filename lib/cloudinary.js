import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function uploadToCloudinary(base64Image, folder = 'sn_collections') {
  try {
    const isVideo = typeof base64Image === 'string' && base64Image.startsWith('data:video/');

    if (isVideo) {
      const result = await cloudinary.uploader.upload(base64Image, {
        folder: folder,
        resource_type: 'video'
      });
      return result.secure_url;
    }

    const result = await cloudinary.uploader.upload(base64Image, {
      folder: folder,
      resource_type: 'auto', // Automatically detects image type
      format: 'jpg', // Convert all to JPG for consistency and smaller size
      quality: 'auto:good', // Automatic quality optimization
      fetch_format: 'auto', // Serve best format based on browser
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'heic', 'heif', 'tiff', 'ico', 'avif'],
      transformation: [
        { width: 2000, height: 2000, crop: 'limit' }, // Max dimensions
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
    });
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
}

export function generateSignature(timestamp, folder = 'sn_collections') {
  const params = {
    timestamp: timestamp,
    folder: folder
  };
  
  const signature = cloudinary.utils.api_sign_request(
    params,
    process.env.CLOUDINARY_API_SECRET
  );
  
  return {
    signature,
    timestamp,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    folder
  };
}

export default cloudinary;
