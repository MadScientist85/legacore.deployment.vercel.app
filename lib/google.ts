import { google } from "googleapis"

interface GoogleConfig {
  clientId?: string
  clientSecret?: string
  redirectUri?: string
  serviceAccountKey?: string
  serviceAccountEmail?: string
  privateKey?: string
}

interface GoogleStatus {
  oauth2Configured: boolean
  serviceAccountConfigured: boolean
  hasAnyAuth: boolean
}

interface ConnectionTestResult {
  success: boolean
  services: string[]
  error?: string
}

class GoogleIntegration {
  private config: GoogleConfig
  private auth: any

  constructor() {
    this.config = {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: process.env.GOOGLE_REDIRECT_URI,
      serviceAccountKey: process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
      serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      privateKey: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }
  }

  async initializeAuth(accessToken?: string) {
    try {
      if (accessToken) {
        // OAuth2 authentication
        this.auth = new google.auth.OAuth2(this.config.clientId, this.config.clientSecret, this.config.redirectUri)
        this.auth.setCredentials({ access_token: accessToken })
      } else if (this.config.serviceAccountKey && this.config.serviceAccountEmail) {
        // Service account authentication
        this.auth = new google.auth.GoogleAuth({
          credentials: {
            client_email: this.config.serviceAccountEmail,
            private_key: this.config.privateKey,
          },
          scopes: [
            "https://www.googleapis.com/auth/drive",
            "https://www.googleapis.com/auth/spreadsheets",
            "https://www.googleapis.com/auth/gmail.send",
          ],
        })
      } else {
        throw new Error("No valid Google authentication configuration found")
      }
      return true
    } catch (error) {
      console.error("Google auth initialization failed:", error)
      return false
    }
  }

  async connectDrive(accessToken?: string) {
    try {
      const authSuccess = await this.initializeAuth(accessToken)
      if (!authSuccess) {
        throw new Error("Authentication failed")
      }

      const drive = google.drive({ version: "v3", auth: this.auth })

      // Test connection by listing files
      const response = await drive.files.list({
        pageSize: 1,
        fields: "files(id, name)",
      })

      return {
        success: true,
        service: drive,
        message: "Google Drive connected successfully",
      }
    } catch (error) {
      console.error("Google Drive connection failed:", error)
      return {
        success: false,
        service: null,
        message: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async connectSheets(accessToken?: string) {
    try {
      const authSuccess = await this.initializeAuth(accessToken)
      if (!authSuccess) {
        throw new Error("Authentication failed")
      }

      const sheets = google.sheets({ version: "v4", auth: this.auth })

      return {
        success: true,
        service: sheets,
        message: "Google Sheets connected successfully",
      }
    } catch (error) {
      console.error("Google Sheets connection failed:", error)
      return {
        success: false,
        service: null,
        message: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async connectGmail(accessToken?: string) {
    try {
      const authSuccess = await this.initializeAuth(accessToken)
      if (!authSuccess) {
        throw new Error("Authentication failed")
      }

      const gmail = google.gmail({ version: "v1", auth: this.auth })

      return {
        success: true,
        service: gmail,
        message: "Gmail connected successfully",
      }
    } catch (error) {
      console.error("Gmail connection failed:", error)
      return {
        success: false,
        service: null,
        message: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async uploadToDrive(fileName: string, fileBuffer: Buffer, mimeType: string, folderId?: string) {
    try {
      const driveConnection = await this.connectDrive()
      if (!driveConnection.success || !driveConnection.service) {
        throw new Error("Drive connection failed")
      }

      const fileMetadata: any = {
        name: fileName,
      }

      if (folderId) {
        fileMetadata.parents = [folderId]
      }

      const media = {
        mimeType,
        body: fileBuffer,
      }

      const response = await driveConnection.service.files.create({
        requestBody: fileMetadata,
        media,
        fields: "id, name, webViewLink",
      })

      return {
        success: true,
        fileId: response.data.id,
        fileName: response.data.name,
        webViewLink: response.data.webViewLink,
      }
    } catch (error) {
      console.error("Drive upload failed:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async createSpreadsheet(title: string, data?: any[][]) {
    try {
      const sheetsConnection = await this.connectSheets()
      if (!sheetsConnection.success || !sheetsConnection.service) {
        throw new Error("Sheets connection failed")
      }

      const resource = {
        properties: {
          title,
        },
      }

      const response = await sheetsConnection.service.spreadsheets.create({
        requestBody: resource,
        fields: "spreadsheetId, spreadsheetUrl",
      })

      const spreadsheetId = response.data.spreadsheetId
      const spreadsheetUrl = response.data.spreadsheetUrl

      // Add data if provided
      if (data && data.length > 0 && spreadsheetId) {
        await sheetsConnection.service.spreadsheets.values.update({
          spreadsheetId,
          range: "A1",
          valueInputOption: "RAW",
          requestBody: {
            values: data,
          },
        })
      }

      return {
        success: true,
        spreadsheetId,
        spreadsheetUrl,
      }
    } catch (error) {
      console.error("Spreadsheet creation failed:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async sendEmail(to: string, subject: string, body: string, isHtml = false) {
    try {
      const gmailConnection = await this.connectGmail()
      if (!gmailConnection.success || !gmailConnection.service) {
        throw new Error("Gmail connection failed")
      }

      const message = [
        `To: ${to}`,
        `Subject: ${subject}`,
        `Content-Type: ${isHtml ? "text/html" : "text/plain"}; charset=utf-8`,
        "",
        body,
      ].join("\n")

      const encodedMessage = Buffer.from(message).toString("base64").replace(/\+/g, "-").replace(/\//g, "_")

      const response = await gmailConnection.service.users.messages.send({
        userId: "me",
        requestBody: {
          raw: encodedMessage,
        },
      })

      return {
        success: true,
        messageId: response.data.id,
      }
    } catch (error) {
      console.error("Email send failed:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async getAuthUrl() {
    try {
      if (!this.config.clientId || !this.config.clientSecret || !this.config.redirectUri) {
        throw new Error("OAuth configuration missing")
      }

      const oauth2Client = new google.auth.OAuth2(
        this.config.clientId,
        this.config.clientSecret,
        this.config.redirectUri,
      )

      const scopes = [
        "https://www.googleapis.com/auth/drive",
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/gmail.send",
      ]

      const url = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: scopes,
      })

      return { success: true, url }
    } catch (error) {
      console.error("Auth URL generation failed:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async exchangeCodeForTokens(code: string) {
    try {
      if (!this.config.clientId || !this.config.clientSecret || !this.config.redirectUri) {
        throw new Error("OAuth configuration missing")
      }

      const oauth2Client = new google.auth.OAuth2(
        this.config.clientId,
        this.config.clientSecret,
        this.config.redirectUri,
      )

      const { tokens } = await oauth2Client.getToken(code)

      return {
        success: true,
        tokens,
      }
    } catch (error) {
      console.error("Token exchange failed:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }
}

// Export singleton instance
export const googleIntegration = new GoogleIntegration()

// Status checking functions
export async function getGoogleStatus(): Promise<GoogleStatus> {
  const oauth2Configured = !!(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_REDIRECT_URI
  )

  const serviceAccountConfigured = !!(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY)

  return {
    oauth2Configured,
    serviceAccountConfigured,
    hasAnyAuth: oauth2Configured || serviceAccountConfigured,
  }
}

export async function testGoogleConnection(): Promise<ConnectionTestResult> {
  try {
    const status = await getGoogleStatus()
    if (!status.hasAnyAuth) {
      return {
        success: false,
        services: [],
        error: "No Google authentication configured",
      }
    }

    const services: string[] = []

    // Test Drive connection
    try {
      const driveResult = await googleIntegration.connectDrive()
      if (driveResult.success) {
        services.push("Drive")
      }
    } catch (error) {
      console.warn("Drive connection test failed:", error)
    }

    // Test Sheets connection
    try {
      const sheetsResult = await googleIntegration.connectSheets()
      if (sheetsResult.success) {
        services.push("Sheets")
      }
    } catch (error) {
      console.warn("Sheets connection test failed:", error)
    }

    // Test Gmail connection
    try {
      const gmailResult = await googleIntegration.connectGmail()
      if (gmailResult.success) {
        services.push("Gmail")
      }
    } catch (error) {
      console.warn("Gmail connection test failed:", error)
    }

    return {
      success: services.length > 0,
      services,
      error: services.length === 0 ? "No services could be connected" : undefined,
    }
  } catch (error) {
    return {
      success: false,
      services: [],
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Export utility functions
export async function connectDrive(accessToken?: string) {
  return googleIntegration.connectDrive(accessToken)
}

export async function connectSheets(accessToken?: string) {
  return googleIntegration.connectSheets(accessToken)
}

export async function connectGmail(accessToken?: string) {
  return googleIntegration.connectGmail(accessToken)
}

export async function uploadToDrive(fileName: string, fileBuffer: Buffer, mimeType: string, folderId?: string) {
  return googleIntegration.uploadToDrive(fileName, fileBuffer, mimeType, folderId)
}

export async function createSpreadsheet(title: string, data?: any[][]) {
  return googleIntegration.createSpreadsheet(title, data)
}

export async function sendEmail(to: string, subject: string, body: string, isHtml = false) {
  return googleIntegration.sendEmail(to, subject, body, isHtml)
}

export async function getGoogleAuthUrl() {
  return googleIntegration.getAuthUrl()
}

export async function exchangeCodeForTokens(code: string) {
  return googleIntegration.exchangeCodeForTokens(code)
}

export default googleIntegration
