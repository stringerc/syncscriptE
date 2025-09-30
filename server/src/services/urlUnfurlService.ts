import axios from 'axios'
import { logger } from './logger'

interface OpenGraphData {
  title?: string
  description?: string
  image?: string
  url?: string
  siteName?: string
  type?: string
}

interface UnfurlResult {
  title: string
  description?: string
  image?: string
  domain: string
  siteName?: string
  price?: number // in cents
}

export class UrlUnfurlService {
  private static instance: UrlUnfurlService
  private cache = new Map<string, UnfurlResult>()

  static getInstance(): UrlUnfurlService {
    if (!UrlUnfurlService.instance) {
      UrlUnfurlService.instance = new UrlUnfurlService()
    }
    return UrlUnfurlService.instance
  }

  async unfurlUrl(url: string): Promise<UnfurlResult | null> {
    try {
      // Check cache first
      if (this.cache.has(url)) {
        return this.cache.get(url)!
      }

      // Validate URL
      const urlObj = new URL(url)
      const domain = urlObj.hostname.replace('www.', '')

      // Fetch the page
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SyncScript/1.0; +https://syncscript.app)'
        },
        maxRedirects: 5
      })

      const html = response.data
      
      // Extract Open Graph data
      const ogData = this.extractOpenGraphData(html)
      
      // Extract price if it's an e-commerce site
      const price = this.extractPrice(html, domain)

      const result: UnfurlResult = {
        title: ogData.title || this.extractTitle(html) || domain,
        description: ogData.description,
        image: ogData.image,
        domain,
        siteName: ogData.siteName,
        price
      }

      // Cache the result
      this.cache.set(url, result)

      logger.info('URL unfurled successfully', { url, domain, title: result.title })
      return result

    } catch (error) {
      logger.error('Failed to unfurl URL', { url, error: error.message })
      return null
    }
  }

  private extractOpenGraphData(html: string): OpenGraphData {
    const ogData: OpenGraphData = {}
    
    // Extract Open Graph meta tags
    const ogTitleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"[^>]*>/i)
    if (ogTitleMatch) ogData.title = ogTitleMatch[1]

    const ogDescriptionMatch = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"[^>]*>/i)
    if (ogDescriptionMatch) ogData.description = ogDescriptionMatch[1]

    const ogImageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"[^>]*>/i)
    if (ogImageMatch) ogData.image = ogImageMatch[1]

    const ogSiteNameMatch = html.match(/<meta[^>]*property="og:site_name"[^>]*content="([^"]*)"[^>]*>/i)
    if (ogSiteNameMatch) ogData.siteName = ogSiteNameMatch[1]

    const ogTypeMatch = html.match(/<meta[^>]*property="og:type"[^>]*content="([^"]*)"[^>]*>/i)
    if (ogTypeMatch) ogData.type = ogTypeMatch[1]

    return ogData
  }

  private extractTitle(html: string): string | null {
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)
    return titleMatch ? titleMatch[1].trim() : null
  }

  private extractPrice(html: string, domain: string): number | undefined {
    try {
      // Common price patterns for e-commerce sites
      const pricePatterns = [
        /<meta[^>]*property="product:price:amount"[^>]*content="([^"]*)"[^>]*>/i,
        /<meta[^>]*name="price"[^>]*content="([^"]*)"[^>]*>/i,
        /<span[^>]*class="[^"]*price[^"]*"[^>]*>.*?\$([0-9,]+\.?[0-9]*)<\/span>/i,
        /<div[^>]*class="[^"]*price[^"]*"[^>]*>.*?\$([0-9,]+\.?[0-9]*)<\/div>/i
      ]

      for (const pattern of pricePatterns) {
        const match = html.match(pattern)
        if (match) {
          const priceStr = match[1].replace(/,/g, '')
          const price = parseFloat(priceStr)
          if (!isNaN(price) && price > 0) {
            return Math.round(price * 100) // Convert to cents
          }
        }
      }

      return undefined
    } catch (error) {
      logger.error('Error extracting price', { domain, error: error.message })
      return undefined
    }
  }

  // Background job to unfurl URLs
  async processUnfurlQueue(resourceIds: string[]): Promise<void> {
    logger.info('Processing unfurl queue', { count: resourceIds.length })
    
    for (const resourceId of resourceIds) {
      try {
        // This would fetch the resource from the database and unfurl its URL
        // For now, we'll just log the processing
        logger.info('Processing resource for unfurling', { resourceId })
        
        // In a real implementation, you would:
        // 1. Fetch the resource from the database
        // 2. Check if it's a URL resource
        // 3. Unfurl the URL
        // 4. Update the resource with the unfurled data
        
      } catch (error) {
        logger.error('Failed to process resource unfurling', { resourceId, error: error.message })
      }
    }
  }

  // Clear cache (useful for testing or memory management)
  clearCache(): void {
    this.cache.clear()
  }
}

export const urlUnfurlService = UrlUnfurlService.getInstance()
