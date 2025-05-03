import admin, { ServiceAccount } from 'firebase-admin';
import serviceAccount from '../../speakup-final-firebase-adminsdk-fbsvc-6b947e7304.json';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as ServiceAccount),
  storageBucket: 'speakup-final', // Replace with your actual bucket name
});

// Retrieve the default storage bucket:
const bucket = admin.storage().bucket();

// Alternatively, get the bucket name like this:
const bucketName = admin.app().options.storageBucket;
console.log(`Using Firebase storage bucket: ${bucketName}`);

/**
 * Uploads a file to Firebase Storage.
 * @param input - Buffer or local path of the file.
 * @param destination - Destination file name in the bucket.
 * @returns Public URL for the uploaded file.
 */
export async function uploadFileToFirebase(input: Buffer | string, destination: string): Promise<string> {
  try {
    const file = bucket.file(destination);

    if (Buffer.isBuffer(input)) {
      const writeStream = file.createWriteStream({
        metadata: {
          contentType: 'audio/mpeg',
          cacheControl: 'public, max-age=31536000',
          metadata: {
            firebaseStorageDownloadTokens: undefined, // This allows public access
          }
        },
        public: true, // Make the file public
      });
      writeStream.end(input);
      await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });
    } else {
      await bucket.upload(input, {
        destination,
        resumable: false,
        metadata: {
          cacheControl: 'public, max-age=31536000',
          metadata: {
            firebaseStorageDownloadTokens: undefined, // This allows public access
          }
        },
        public: true, // Make the file public
      });
    }

    // Generate a signed URL for public access
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;

    return publicUrl;
  } catch (error: any) {
    console.error('Firebase upload error:', error);
    throw new Error(`Failed to upload to Firebase: ${error.message}`);
  }
}

export const writeToFirebase = async (userID: string, sessionID: string, result: any) => {
  try {
    const docRef = admin.firestore()
      .collection('users')
      .doc(userID)
      .collection('sessions')
      .doc(sessionID);
    
    await docRef.set({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ...result
    });
    
    console.log('Successfully wrote to Firebase:', { userID, sessionID, result });
  } catch (error) {
    console.error('Error writing to Firebase:', error);
    throw error;
  }
}

