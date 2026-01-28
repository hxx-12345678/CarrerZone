"use client"

import { useState, useEffect, useRef } from 'react'
import { FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PDFViewerProps {
  pdfUrl: string
  className?: string
}

export function PDFViewer({ pdfUrl, className = '' }: PDFViewerProps) {
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [zoomLevel, setZoomLevel] = useState<number>(100)
  const [pageCount, setPageCount] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [viewMode, setViewMode] = useState<'fit' | 'fitH' | 'fitV'>('fitH')
  const pdfObjectRef = useRef<HTMLObjectElement>(null)

  // Detect browser zoom level
  useEffect(() => {
    const detectZoom = () => {
      const zoom = Math.round(window.devicePixelRatio * 100);
      setZoomLevel(zoom);
      console.log('🔍 Browser zoom level detected:', zoom + '%');
    };

    // Initial detection
    detectZoom();

    // Listen for zoom changes
    const handleResize = () => {
      setTimeout(detectZoom, 100);
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Fetch PDF and detect page count
  useEffect(() => {
    let objectUrl: string | null = null;
    
    async function fetchPDF() {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('token');
        console.log('📄 Fetching PDF from:', pdfUrl);
        
        const response = await fetch(pdfUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('NO_RESUME_FOUND');
          }
          throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
        }
        
        const blob = await response.blob();
        console.log('📄 PDF blob created, size:', blob.size);
        
        // Try to detect page count using PDF.js if available
        try {
          // @ts-ignore - pdfjs-dist may not be installed, but we'll check if it's available
          if (typeof window !== 'undefined' && (window as any).pdfjsLib) {
            const arrayBuffer = await blob.arrayBuffer();
            const pdf = await (window as any).pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            const detectedPageCount = pdf.numPages;
            setPageCount(detectedPageCount);
            console.log('📄 Detected page count:', detectedPageCount);
            
            // Always use FitH for consistent one-page view with scrolling
            setViewMode('fitH'); // Fit horizontally - one page fills width, scroll for more pages
          }
        } catch (pdfError) {
          console.log('📄 Could not detect page count (pdfjs not available):', pdfError);
          // Default to fitH mode - one page view with scrolling
          setViewMode('fitH');
        }
        
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
        setLoading(false);
        setError(null);
        
        console.log('📄 PDF loaded successfully via blob URL');
      } catch (err) {
        console.error('📄 PDF fetch error:', err);
        setError('Unable to load PDF preview. Please use the View CV button below.');
        setLoading(false);
      }
    }
    
    if (pdfUrl) {
      fetchPDF();
    }
    
    // Cleanup blob URL on unmount
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [pdfUrl]);

  // Zoom controls
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 25, 50));
  };

  const handleZoomReset = () => {
    setZoomLevel(100);
  };

  const handlePageNext = () => {
    if (pageCount && currentPage < pageCount) {
      setCurrentPage(prev => prev + 1);
      // Scroll PDF to next page
      if (pdfObjectRef.current) {
        const pdfDoc = (pdfObjectRef.current as any).contentDocument;
        if (pdfDoc) {
          pdfDoc.defaultView.scrollTo(0, pdfDoc.body.scrollHeight * (currentPage / pageCount));
        }
      }
    }
  };

  const handlePagePrev = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
      // Scroll PDF to previous page
      if (pdfObjectRef.current) {
        const pdfDoc = (pdfObjectRef.current as any).contentDocument;
        if (pdfDoc) {
          pdfDoc.defaultView.scrollTo(0, pdfDoc.body.scrollHeight * ((currentPage - 2) / (pageCount || 1)));
        }
      }
    }
  };

  return (
    <div className={`w-full h-full ${className}`}>
      {/* PDF Display Area - white background to match PDF */}
      <div className="relative w-full h-full bg-white rounded-lg border border-gray-200 overflow-hidden" style={{ background: 'white' }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-95 z-20">
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-blue-600 animate-pulse" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Resume...</h3>
              <p className="text-sm text-gray-600">Please wait while we load the PDF preview.</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-full bg-gray-50">
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {error === 'NO_RESUME_FOUND' ? 'No Resume Found' : 'PDF Preview Not Available'}
              </h3>
              <p className="text-sm text-gray-600">
                {error === 'NO_RESUME_FOUND' 
                  ? 'No resume has been uploaded for this candidate.' 
                  : 'Unable to load PDF preview. Please use the View CV button below to view the resume.'}
              </p>
            </div>
          </div>
        )}

        {!error && !loading && blobUrl && (
          <div className="relative w-full h-full flex flex-col" key={`pdf-${zoomLevel}-${viewMode}`}>
            {/* PDF Controls Bar - Removed zoom and refresh controls */}
            {pageCount && pageCount > 1 && (
              <div className="flex items-center justify-center px-4 py-2 bg-slate-50 border-b border-slate-200 rounded-t-lg z-20">
                {/* Page Navigation - Only show for multi-page PDFs */}
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePagePrev}
                    disabled={currentPage === 1}
                    className="h-7 px-2"
                  >
                    ←
                  </Button>
                  <span className="text-xs text-slate-600 px-2">
                    Page {currentPage} of {pageCount}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePageNext}
                    disabled={currentPage === pageCount}
                    className="h-7 px-2"
                  >
                    →
                  </Button>
                </div>
              </div>
            )}
            
            {/* PDF Container - responsive height with max-height */}
            <div 
              className="relative w-full"
              style={{ 
                background: '#ffffff',
                padding: '0',
                margin: '0',
                width: '100%',
                minHeight: 'clamp(500px, 60vh, 900px)',
                maxHeight: '90vh',
                overflow: 'hidden',
                position: 'relative',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                aspectRatio: '8.5 / 11' // Standard letter aspect ratio
              }}
            >
              {/* Use iframe - responsive sizing */}
                <iframe
                  src={`${blobUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH&zoom=${zoomLevel}`}
                  title="Resume Preview"
                  style={{ 
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    outline: 'none',
                    display: 'block',
                    background: '#ffffff',
                    backgroundColor: '#ffffff',
                    padding: '0',
                    margin: '0'
                }}
                allow="fullscreen"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
