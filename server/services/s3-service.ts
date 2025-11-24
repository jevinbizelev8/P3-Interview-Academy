import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export class S3Service {
  private s3Client: S3Client;
  private bucketName: string;
  private region: string;

  constructor() {
    this.region = process.env.AWS_REGION || 'ap-southeast-1';
    this.bucketName = process.env.S3_BUCKET_NAME || 'p3-user-uploads';

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  /**
   * Upload profile photo to S3 and return public URL
   */
  async uploadProfilePhoto(
    userId: string,
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string
  ): Promise<string> {
    // Create unique key with timestamp to prevent caching issues
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `profile-photos/${userId}/${timestamp}-${sanitizedFileName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
      // Make file publicly readable
      ACL: 'public-read',
      // Cache for 1 day
      CacheControl: 'public, max-age=86400',
    });

    await this.s3Client.send(command);

    // Return public URL
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
  }

  /**
   * Delete old profile photo from S3
   */
  async deleteProfilePhoto(photoUrl: string): Promise<void> {
    try {
      // Extract key from URL
      const urlParts = photoUrl.split('.amazonaws.com/');
      if (urlParts.length !== 2) {
        console.warn('Invalid S3 URL format:', photoUrl);
        return;
      }

      const key = urlParts[1];

      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      console.log('✅ Deleted old profile photo:', key);
    } catch (error) {
      console.error('Error deleting old profile photo:', error);
      // Don't throw - deletion failure shouldn't block upload
    }
  }

  /**
   * Get signed URL for private access (if ACL is private in future)
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * Check if S3 is properly configured
   */
  async healthCheck(): Promise<boolean> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: 'health-check.txt',
        Body: Buffer.from('OK'),
      });

      await this.s3Client.send(command);

      // Clean up test file
      const deleteCommand = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: 'health-check.txt',
      });
      await this.s3Client.send(deleteCommand);

      return true;
    } catch (error) {
      console.error('S3 health check failed:', error);
      return false;
    }
  }
}
