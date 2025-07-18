interface WikipediaSearchResult {
  title: string;
  snippet: string;
  pageid: number;
}

interface WikipediaPageContent {
  title: string;
  extract: string;
  content?: string;
}

export class WikipediaService {
  private static readonly BASE_URL = 'https://en.wikipedia.org/w/api.php';

  static async searchWikipedia(query: string, limit: number = 5): Promise<WikipediaSearchResult[]> {
    try {
      const searchParams = new URLSearchParams({
        action: 'query',
        list: 'search',
        srsearch: query,
        format: 'json',
        origin: '*',
        srlimit: limit.toString(),
        srprop: 'snippet'
      });

      const response = await fetch(`${this.BASE_URL}?${searchParams}`);
      const data = await response.json();

      if (data.query && data.query.search) {
        return data.query.search.map((result: any) => ({
          title: result.title,
          snippet: result.snippet.replace(/<[^>]*>/g, ''), // Remove HTML tags
          pageid: result.pageid
        }));
      }

      return [];
    } catch (error) {
      console.error('Error searching Wikipedia:', error);
      return [];
    }
  }

  static async getPageContent(title: string): Promise<WikipediaPageContent | null> {
    try {
      const searchParams = new URLSearchParams({
        action: 'query',
        prop: 'extracts|info',
        titles: title,
        format: 'json',
        origin: '*',
        exintro: '1',
        explaintext: '1',
        exsectionformat: 'plain',
        inprop: 'url'
      });

      const response = await fetch(`${this.BASE_URL}?${searchParams}`);
      const data = await response.json();

      if (data.query && data.query.pages) {
        const pages = Object.values(data.query.pages) as any[];
        const page = pages[0];

        if (page && !page.missing) {
          return {
            title: page.title,
            extract: page.extract || '',
            content: page.extract || ''
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Error fetching Wikipedia page:', error);
      return null;
    }
  }

  static async getRelevantContent(query: string): Promise<string> {
    try {
      // First, search for relevant pages
      const searchResults = await this.searchWikipedia(query, 3);
      
      if (searchResults.length === 0) {
        return '';
      }

      // Get content from the most relevant page
      const topResult = searchResults[0];
      const pageContent = await this.getPageContent(topResult.title);

      if (pageContent && pageContent.extract) {
        // Return a summary with the page title and extract
        return `Wikipedia তথ্য - ${pageContent.title}:\n\n${pageContent.extract}`;
      }

      // If no full content, return search snippet
      return `Wikipedia তথ্য:\n\n${topResult.snippet}`;
    } catch (error) {
      console.error('Error getting relevant Wikipedia content:', error);
      return '';
    }
  }
}