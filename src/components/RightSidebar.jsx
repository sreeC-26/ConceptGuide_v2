import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { ENDPOINTS } from '../config';

// Helper function to parse text by headings and structure
const parseTextByStructure = (text) => {
  if (!text || !text.trim()) return [];
  
  const lines = text.split(/\n+/).filter(line => line.trim());
  const sections = [];
  let currentContent = [];
  
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    
    // Skip common header/footer patterns (page numbers, dates, etc.)
    if (/^\d+$/.test(trimmed) && trimmed.length < 4) return; // Just page numbers
    if (/^(Page \d+|p\.\?\d+|-\d+-)$/i.test(trimmed)) return; // Page indicators
    if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(trimmed)) return; // Dates
    
    // Detect headings - lines that are:
    // 1. All caps and short (3-60 chars)
    // 2. End with colon
    // 3. Short lines that start with capital and have no punctuation
    const isHeading = trimmed.length >= 3 && trimmed.length <= 60 && (
      (trimmed === trimmed.toUpperCase() && trimmed.length > 3) ||
      trimmed.endsWith(':') ||
      (/^[A-Z][A-Za-z\s]{2,}$/.test(trimmed) && !trimmed.includes('.') && !trimmed.includes(','))
    );
    
    // Detect subheadings - similar but lowercase allowed, shorter
    const isSubheading = !isHeading && trimmed.length >= 3 && trimmed.length <= 40 && (
      trimmed.endsWith(':') ||
      (/^[A-Z][a-z\s]{2,}$/.test(trimmed) && trimmed.length < 40)
    );
    
    if (isHeading) {
      // Save previous content
      if (currentContent.length > 0) {
        sections.push({ type: 'content', text: currentContent.join(' ') });
        currentContent = [];
      }
      sections.push({ type: 'heading', text: trimmed });
    } else if (isSubheading) {
      // Save previous content
      if (currentContent.length > 0) {
        sections.push({ type: 'content', text: currentContent.join(' ') });
        currentContent = [];
      }
      sections.push({ type: 'subheading', text: trimmed });
    } else {
      // Regular content
      currentContent.push(trimmed);
    }
  });
  
  // Add remaining content
  if (currentContent.length > 0) {
    sections.push({ type: 'content', text: currentContent.join(' ') });
  }
  
  return sections;
};

// Component to render content with proper bullet and table handling
const ContentRenderer = ({ content }) => {
  if (!content) return null;

  const lines = content.split('\n');
  const renderedContent = [];

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    
    if (!trimmed) {
      // Empty line
      renderedContent.push(<div key={`empty-${i}`} className="mb-2" style={{ height: '0.5rem' }}></div>);
      return;
    }

    // Handle bullets - check for patterns like "Purpose: * item" or "* item" or "- item"
    // Also handle multiple bullets in same line separated by spaces or commas
    const bulletMatch = trimmed.match(/^([^:*-]+?)\s*:\s*([*•-])\s+(.+)$/) || 
                       trimmed.match(/^([*•-])\s+(.+)$/);
    
    if (bulletMatch) {
      // Handle format: "Purpose: * item" or "* item"
      if (bulletMatch[1] && bulletMatch[2] && bulletMatch[3]) {
        const [, prefix, bulletChar, itemText] = bulletMatch;
        renderedContent.push(
          <div key={i} className="mb-2 flex items-start" style={{ marginLeft: '0' }}>
            <span style={{ fontFamily: 'Poppins, sans-serif', color: '#FFFFFF', fontWeight: 600, marginRight: '0.5rem' }}>
              {prefix}:
            </span>
            <div className="flex items-start" style={{ marginLeft: '0.5rem' }}>
              <span style={{ color: '#FF4081', marginRight: '0.5rem', marginTop: '0.125rem', fontSize: '1.2em' }}>•</span>
              <span style={{ flex: 1, fontFamily: 'Poppins, sans-serif', color: '#F5D9E4' }}>{itemText.trim()}</span>
            </div>
          </div>
        );
      } else {
        // Handle format: "* item" - also check if there are multiple bullets in one line
        const [, bulletChar, itemText] = bulletMatch;
        
        // Check if there are more bullets in the text (e.g., "item * another item")
        const items = itemText.split(/\s+[*•-]\s+/).map(item => item.trim()).filter(item => item);
        
        if (items.length > 1) {
          // Multiple bullets in one line - render separately
          items.forEach((item, idx) => {
            renderedContent.push(
              <div key={`${i}-${idx}`} className="mb-2 flex items-start" style={{ marginLeft: '1rem' }}>
                <span style={{ color: '#FF4081', marginRight: '0.5rem', marginTop: '0.125rem', fontSize: '1.2em' }}>•</span>
                <span style={{ flex: 1, fontFamily: 'Poppins, sans-serif', color: '#F5D9E4' }}>{item}</span>
              </div>
            );
          });
        } else {
          // Single bullet
          renderedContent.push(
            <div key={i} className="mb-2 flex items-start" style={{ marginLeft: '1rem' }}>
              <span style={{ color: '#FF4081', marginRight: '0.5rem', marginTop: '0.125rem', fontSize: '1.2em' }}>•</span>
              <span style={{ flex: 1, fontFamily: 'Poppins, sans-serif', color: '#F5D9E4' }}>{itemText.trim()}</span>
            </div>
          );
        }
      }
      return;
    }

      // Handle numbered lists
      const numberedMatch = trimmed.match(/^(\d+[\.\)])\s*(.+)$/);
      if (numberedMatch) {
        const [, number, text] = numberedMatch;
        renderedContent.push(
          <div key={i} className="flex items-start mb-2" style={{ marginLeft: '1rem' }}>
            <span style={{ color: '#FF4081', marginRight: '0.5rem', marginTop: '0.125rem', fontFamily: 'Poppins, sans-serif', fontWeight: 600 }}>
              {number}
            </span>
            <span style={{ flex: 1, fontFamily: 'Poppins, sans-serif', color: '#F5D9E4' }}>{text}</span>
          </div>
        );
        return;
      }

      // Regular text - check if it contains bullets that weren't caught (e.g., "item * another item" without line break)
      // Split by common bullet patterns and render separately
      if (trimmed.includes(' * ') || trimmed.includes(' • ') || trimmed.includes(' - ')) {
        // Split by bullet separators
        const parts = trimmed.split(/\s+[*•-]\s+/);
        if (parts.length > 1) {
          parts.forEach((part, partIdx) => {
            const cleaned = part.trim();
            if (cleaned) {
              renderedContent.push(
                <div key={`${i}-${partIdx}`} className="mb-2 flex items-start" style={{ marginLeft: '1rem' }}>
                  <span style={{ color: '#FF4081', marginRight: '0.5rem', marginTop: '0.125rem', fontSize: '1.2em' }}>•</span>
                  <span style={{ flex: 1, fontFamily: 'Poppins, sans-serif', color: '#F5D9E4' }}>{cleaned}</span>
                </div>
              );
            }
          });
          return;
        }
      }

      // Regular text
      renderedContent.push(
        <div key={i} className="mb-2" style={{ fontFamily: 'Poppins, sans-serif', color: '#F5D9E4' }}>
          {trimmed}
        </div>
      );
  });

  return (
    <div className="text-sm leading-relaxed mb-4 px-2" style={{ fontFamily: 'Poppins, sans-serif', color: '#F5D9E4' }}>
      {renderedContent}
    </div>
  );
};

export default function RightSidebar() {
  const {
    pageTexts,
    setSelection,
    setShowQuestionModal,
    fullText,
    fileName,
    history,
    setCurrentSessionId,
  } = useAppStore();
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  const [parsedPages, setParsedPages] = useState([]);
  const [isCleaning, setIsCleaning] = useState(false);
  const contentRef = useRef(null);
  const pdfViewerRef = useRef(null);

  useEffect(() => {
    if (pageTexts && pageTexts.length > 0) {
      cleanAndOrganizeContent();
    }
  }, [pageTexts]);

  const cleanAndOrganizeContent = async () => {
    if (!pageTexts || pageTexts.length === 0) return;
    
    setIsCleaning(true);
    try {
      // Combine all page texts
      const combinedText = pageTexts.join('\n\n');
      
      const response = await fetch(ENDPOINTS.CLEAN_PDF_CONTENT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: combinedText }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to clean content');
      }
      
      const data = await response.json();
      const cleanedText = data.cleanedText || combinedText;
      
      // Parse markdown structure
      const lines = cleanedText.split('\n');
      const sections = [];
      let currentSection = { type: 'content', text: '' };
      
      lines.forEach((line) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('## ')) {
          if (currentSection.text) {
            sections.push(currentSection);
          }
          currentSection = { type: 'heading', text: trimmed.substring(3) };
          sections.push(currentSection);
          currentSection = { type: 'content', text: '' };
        } else if (trimmed.startsWith('### ')) {
          if (currentSection.text) {
            sections.push(currentSection);
          }
          currentSection = { type: 'subheading', text: trimmed.substring(4) };
          sections.push(currentSection);
          currentSection = { type: 'content', text: '' };
        } else if (trimmed) {
          if (currentSection.text) {
            currentSection.text += ' ' + trimmed;
          } else {
            currentSection.text = trimmed;
          }
        } else {
          // Empty line - break content
          if (currentSection.text && currentSection.type === 'content') {
            sections.push(currentSection);
            currentSection = { type: 'content', text: '' };
          }
        }
      });
      
      if (currentSection.text) {
        sections.push(currentSection);
      }
      
      // Group by pages (approximate - since cleaned text doesn't have page markers)
      setParsedPages([{
        pageNumber: 1,
        sections: sections.length > 0 ? sections : [{ type: 'content', text: cleanedText }]
      }]);
    } catch (error) {
      console.error('Error cleaning content:', error);
      // Fallback to original parsing
      const parsed = pageTexts.map((pageText, pageIndex) => {
        const sections = parseTextByStructure(pageText);
        return {
          pageNumber: pageIndex + 1,
          sections: sections.length > 0 ? sections : [{ type: 'content', text: pageText }]
        };
      });
      setParsedPages(parsed);
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <>
      {isRightSidebarOpen && (
        <div className="w-1/2 flex flex-col h-full panel gradient-border">
          <div className="p-4 flex items-center justify-between flex-shrink-0" style={{ borderBottom: '1px solid #FF4081' }}>
            <div className="flex items-center gap-3">
              <div className="window-controls" style={{ marginBottom: 0 }}>
                <div className="window-dot window-dot-red"></div>
                <div className="window-dot window-dot-yellow"></div>
                <div className="window-dot window-dot-green"></div>
              </div>
              <h2 className="text-2xl" style={{ fontFamily: 'Poppins, sans-serif', color: '#FFFFFF' }}>PDF Content</h2>
            </div>
            <button
              onClick={() => setIsRightSidebarOpen(prev => !prev)}
              className="transition-colors duration-200 rounded-full p-1"
              style={{ color: '#FF4081' }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Scrollable content area */}
          <div ref={contentRef} className="flex-1 overflow-y-auto p-4 select-text" style={{ userSelect: 'text' }}>
            {isCleaning ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#FF4081' }}></div>
                  <p className="text-sm" style={{ fontFamily: 'Poppins, sans-serif', color: '#F5D9E4' }}>Cleaning and organizing content...</p>
                </div>
              </div>
            ) : parsedPages.length > 0 ? (
              <div className="space-y-6">
                {parsedPages.map((page) => (
                  <div key={page.pageNumber} className="select-text">
                    {/* Page Header */}
                    <div className="mb-4 pb-3 rounded-lg px-3 py-2" style={{ borderBottom: '1px solid #FF4081' }}>
                      <h3 className="text-lg" style={{ fontFamily: 'Poppins, sans-serif', color: '#FF4081' }}>
                        📄 Page {page.pageNumber}
                      </h3>
                    </div>
                    
                    {/* Page Content */}
                    <div className="space-y-4">
                      {page.sections.map((section, idx) => (
                        <div key={idx}>
                          {section.type === 'heading' ? (
                            <h4 className="mb-3 text-xl leading-tight px-3 py-2 rounded-lg" style={{ fontFamily: 'Poppins, sans-serif', color: '#FFFFFF', backgroundColor: '#1A1A1A', borderLeft: '4px solid #FF4081' }}>
                              {section.text}
                            </h4>
                          ) : section.type === 'subheading' ? (
                            <h5 className="mb-2 text-base leading-tight px-2 py-1 rounded" style={{ fontFamily: 'Poppins, sans-serif', color: '#FF4081', backgroundColor: '#1A1A1A', borderLeft: '3px solid #E0007A' }}>
                              {section.text}
                            </h5>
                          ) : (
                            <ContentRenderer content={section.text} />
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {/* Page Separator */}
                    {page.pageNumber < parsedPages.length && (
                      <div className="mt-6 pt-4" style={{ borderTop: '1px solid #FF4081' }}></div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm" style={{ fontFamily: 'Poppins, sans-serif', color: '#F5D9E4' }}>No PDF content loaded</p>
            )}
          </div>
          
          {/* Fixed button at bottom */}
          <div className="p-4 flex-shrink-0" style={{ borderTop: '1px solid #FF4081' }}>
            <button
              onClick={() => {
                // Get selected text from the content area
                const selection = window.getSelection();
                const selectedText = selection.toString().trim();
                
                if (!selectedText) {
                  // If no text is selected, try to get text from the content ref
                  if (contentRef.current) {
                    const text = contentRef.current.innerText || '';
                    if (text.trim()) {
                      // Use first 200 chars as selection if nothing is selected
                      const defaultSelection = text.substring(0, 200).trim();
                      const contextStart = Math.max(0, 0);
                      const contextEnd = Math.min(text.length, 500);
                      const surroundingContext = text.substring(contextStart, contextEnd);
                      
                      setSelection(defaultSelection, surroundingContext);
                      setShowQuestionModal(true);
                      return;
                    }
                  }
                  alert('Please select some text first, or the button will use the first part of the content.');
                  return;
                }
                
                // Get surrounding context (500 chars before and after)
                let surroundingContext = '';
                if (contentRef.current) {
                  const fullText = contentRef.current.innerText || '';
                  const selectedIndex = fullText.indexOf(selectedText);
                  
                  if (selectedIndex !== -1) {
                    const contextStart = Math.max(0, selectedIndex - 500);
                    const contextEnd = Math.min(fullText.length, selectedIndex + selectedText.length + 500);
                    surroundingContext = fullText.substring(contextStart, contextEnd);
                  } else {
                    surroundingContext = fullText.substring(0, 1000);
                  }
                } else {
                  // Fallback to fullText from store
                  surroundingContext = fullText || '';
                }
                
                setSelection(selectedText, surroundingContext);
                setShowQuestionModal(true);
              }}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              I'm confused about this
            </button>
          </div>
        </div>
      )}
      {!isRightSidebarOpen && (
        <button
          onClick={() => setIsRightSidebarOpen(prev => !prev)}
          className="w-12 flex items-center justify-center transition-colors duration-200"
          style={{ backgroundColor: '#2D2D2D', borderRight: '1px solid #FF4081' }}
        >
          <svg className="w-5 h-5" style={{ color: '#FF4081' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
    </>
  );
}
