// Genuine Public APIs Services for StudentOS

// 1. arXiv Research Paper Search
export interface ArxivPaper {
  id: string;
  title: string;
  summary: string;
  authors: string[];
  published: string;
  updated: string;
  pdfUrl: string;
  arxivUrl: string;
  primaryCategory: string;
}

export async function searchArxiv(query: string, category = 'all', maxResults = 12): Promise<ArxivPaper[]> {
  try {
    let searchQuery = query.trim() ? `all:${encodeURIComponent(query.trim())}` : 'cat:cs.AI+OR+cat:physics+OR+cat:math';
    if (category !== 'all') {
      searchQuery = query.trim() ? `cat:${category}+AND+all:${encodeURIComponent(query.trim())}` : `cat:${category}`;
    }

    const url = `https://export.arxiv.org/api/query?search_query=${searchQuery}&start=0&max_results=${maxResults}&sortBy=submittedDate&sortOrder=descending`;
    const res = await fetch(url);
    const xmlText = await res.text();

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    const entries = xmlDoc.getElementsByTagName('entry');

    const papers: ArxivPaper[] = [];
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const id = entry.getElementsByTagName('id')[0]?.textContent || `arxiv-${i}`;
      const title = entry.getElementsByTagName('title')[0]?.textContent?.replace(/\s+/g, ' ').trim() || 'Untitled Paper';
      const summary = entry.getElementsByTagName('summary')[0]?.textContent?.replace(/\s+/g, ' ').trim() || '';
      const published = entry.getElementsByTagName('published')[0]?.textContent || '';
      const updated = entry.getElementsByTagName('updated')[0]?.textContent || '';
      
      const authorNodes = entry.getElementsByTagName('author');
      const authors: string[] = [];
      for (let j = 0; j < authorNodes.length; j++) {
        const name = authorNodes[j].getElementsByTagName('name')[0]?.textContent;
        if (name) authors.push(name.trim());
      }

      let pdfUrl = '';
      let arxivUrl = id;
      const linkNodes = entry.getElementsByTagName('link');
      for (let j = 0; j < linkNodes.length; j++) {
        const link = linkNodes[j];
        if (link.getAttribute('title') === 'pdf') {
          pdfUrl = link.getAttribute('href') || '';
        }
      }
      if (!pdfUrl) {
        pdfUrl = id.replace('/abs/', '/pdf/') + '.pdf';
      }

      const primCatNode = entry.getElementsByTagName('arxiv:primary_category')[0] || entry.getElementsByTagName('category')[0];
      const primaryCategory = primCatNode?.getAttribute('term') || 'General';

      papers.push({
        id,
        title,
        summary,
        authors: authors.slice(0, 5),
        published: published ? new Date(published).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '',
        updated,
        pdfUrl,
        arxivUrl,
        primaryCategory,
      });
    }
    return papers;
  } catch (err) {
    console.error('arXiv API fetch error:', err);
    return [];
  }
}

// 2. Open Library Textbook & Book Search
export interface OpenLibraryBook {
  key: string;
  title: string;
  authorNames: string[];
  firstPublishYear?: number;
  isbn?: string[];
  coverUrl?: string;
  editionCount?: number;
  openLibraryUrl: string;
  subjects?: string[];
}

export async function searchOpenLibrary(query: string, limit = 12): Promise<OpenLibraryBook[]> {
  try {
    if (!query.trim()) return [];
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query.trim())}&limit=${limit}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.docs) return [];

    return data.docs.map((doc: any) => {
      const coverId = doc.cover_i;
      const coverUrl = coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : undefined;
      return {
        key: doc.key,
        title: doc.title,
        authorNames: doc.author_name || ['Unknown Author'],
        firstPublishYear: doc.first_publish_year,
        isbn: doc.isbn?.slice(0, 3),
        coverUrl,
        editionCount: doc.edition_count,
        openLibraryUrl: `https://openlibrary.org${doc.key}`,
        subjects: doc.subject?.slice(0, 4) || [],
      };
    });
  } catch (err) {
    console.error('Open Library API fetch error:', err);
    return [];
  }
}

// 3. Wikipedia Quick Look Summary
export interface WikipediaSummary {
  title: string;
  displayTitle: string;
  extract: string;
  description?: string;
  thumbnailUrl?: string;
  pageUrl: string;
}

export async function fetchWikipediaSummary(term: string): Promise<WikipediaSummary | null> {
  try {
    if (!term.trim()) return null;
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(term.trim().replace(/\s+/g, '_'))}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();

    if (data.type === 'disambiguation' || !data.extract) return null;

    return {
      title: data.title,
      displayTitle: data.displaytitle || data.title,
      extract: data.extract,
      description: data.description,
      thumbnailUrl: data.thumbnail?.source,
      pageUrl: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(data.title)}`,
    };
  } catch (err) {
    console.error('Wikipedia API fetch error:', err);
    return null;
  }
}

// 4. NASA Astronomy Picture of the Day (APOD)
export interface NasaApod {
  title: string;
  date: string;
  explanation: string;
  url: string;
  hdurl?: string;
  mediaType: string;
  copyright?: string;
}

export async function fetchNasaApod(): Promise<NasaApod | null> {
  try {
    const res = await fetch('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY');
    if (!res.ok) return null;
    const data = await res.json();
    return {
      title: data.title,
      date: data.date,
      explanation: data.explanation,
      url: data.url,
      hdurl: data.hdurl,
      mediaType: data.media_type,
      copyright: data.copyright,
    };
  } catch (err) {
    console.error('NASA APOD API error:', err);
    return null;
  }
}
