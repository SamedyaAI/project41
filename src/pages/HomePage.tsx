import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileUp, FileText, Upload, Loader2, X, ChevronLeft, ChevronRight, Info, MessageSquare, Star, StarOff } from 'lucide-react';
import axios from 'axios';
import { SVG_TEMPLATES, TemplateType } from '../library/templates';
import { TEMPLATE_PREVIEWS } from '../library/templatePreviews';
import { FeedbackForm } from '../components/FeedbackForm';
import { supabase } from '../lib/supabase';
import { ProcessingAnimation } from '../components/ProcessingAnimation';

const API_URL = 'http://localhost:3000/api/process-pdf';

const DESIGN_INFO = {
  bmj: {
    features: [
      "Clean grid-based layout",
      "Emphasis on data visualization",
      "Professional color scheme",
      "Clear section hierarchy"
    ],
    bestFor: [
      "Medical research papers",
      "Clinical trial results",
      "Statistical data presentation",
      "Healthcare studies"
    ]
  },
  good: {
    features: [
      "Fluid gradient transitions",
      "Modern wave patterns",
      "Dynamic visual flow",
      "Balanced composition"
    ],
    bestFor: [
      "Research summaries",
      "Scientific findings",
      "Academic presentations",
      "Data storytelling"
    ]
  },
  vascular: {
    features: [
      "High-contrast red accents",
      "Bold visual hierarchy",
      "Strong data emphasis",
      "Clear clinical focus"
    ],
    bestFor: [
      "Surgical outcomes",
      "Clinical procedures",
      "Medical interventions",
      "Treatment comparisons"
    ]
  },
  medical: {
    features: [
      "Deep blue color palette",
      "Sophisticated data charts",
      "Professional aesthetics",
      "Clean typography"
    ],
    bestFor: [
      "Medical journals",
      "Healthcare research",
      "Clinical studies",
      "Treatment outcomes"
    ]
  },
  urology: {
    features: [
      "Multi-color gradients",
      "Modern design elements",
      "Dynamic visual style",
      "Engaging layout"
    ],
    bestFor: [
      "Research presentations",
      "Scientific posters",
      "Conference materials",
      "Academic submissions"
    ]
  }
};

interface Feedback {
  id: string;
  rating: number;
  comment: string | null;
  user_name: string;
  created_at: string;
}

function HomePage() {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('bmj');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [svgFile, setSvgFile] = useState<File | null>(null);
  const [customSvgTemplate, setCustomSvgTemplate] = useState<string | null>(null);
  const [processedSvg, setProcessedSvg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalTemplate, setModalTemplate] = useState<TemplateType | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [currentAbstractId, setCurrentAbstractId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(true);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const templates = Object.entries(TEMPLATE_PREVIEWS);
  const slideWidth = 300;

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      setFeedbackError(null);
      const { data, error: supabaseError } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(4);

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      if (!data) {
        throw new Error('No feedback data received');
      }

      setFeedback(data);
    } catch (err) {
      console.error('Error fetching feedback:', err);
      setFeedbackError(err instanceof Error ? err.message : 'Failed to load feedback');
      setFeedback([]); // Reset feedback on error
    } finally {
      setFeedbackLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setShowModal(false);
      }
    };

    if (showModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showModal]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (!isPaused) {
      interval = setInterval(() => {
        setCurrentSlide((prev) => {
          const next = (prev + 1) % templates.length;
          return next;
        });
      }, 1700);
    }

    return () => clearInterval(interval);
  }, [isPaused, templates.length]);

  const scrollTo = (direction: 'prev' | 'next') => {
    setCurrentSlide((prev) => {
      if (direction === 'prev') {
        return prev === 0 ? templates.length - 1 : prev - 1;
      } else {
        return (prev + 1) % templates.length;
      }
    });
  };

  const onDropPdf = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setPdfFile(file);
    }
  }, []);

  const onDropSvg = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setSvgFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setCustomSvgTemplate(e.target?.result as string);
      };
      reader.readAsText(file);
    }
  }, []);

  const { getRootProps: getPdfRootProps, getInputProps: getPdfInputProps } = useDropzone({
    onDrop: onDropPdf,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1
  });

  const { getRootProps: getSvgRootProps, getInputProps: getSvgInputProps } = useDropzone({
    onDrop: onDropSvg,
    accept: { 'image/svg+xml': ['.svg'] },
    maxFiles: 1
  });

  const processFiles = async () => {
    if (!pdfFile) {
      setError('Please upload a PDF file');
      return;
    }

    setLoading(true);
    setError(null);
    const startTime = Date.now();

    try {
      const formData = new FormData();
      formData.append('pdfFile', pdfFile);
      formData.append('template', selectedTemplate);

      const svgTemplate = customSvgTemplate || SVG_TEMPLATES[selectedTemplate];
      formData.append('svgTemplate', svgTemplate);

      const response = await axios.post(API_URL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log(response, ' is the svg response I got.')
      setProcessedSvg(response.data.svg);
      
      const endTime = Date.now();
      const processingTime = Math.floor((endTime - startTime) / 1000);
      const minutes = Math.floor(processingTime / 60);
      const seconds = processingTime % 60;
      
      // Show processing time message
      setError(`Processing completed in ${minutes} minute${minutes !== 1 ? 's' : ''} ${seconds} second${seconds !== 1 ? 's' : ''}`);
      setTimeout(() => setError(null), 5000); // Clear message after 5 seconds

      // Save to Supabase and get ID
      const { data, error: saveError } = await supabase
        .from('visual_abstracts')
        .insert({
          title: 'My Visual Abstract',
          template: selectedTemplate,
          svg_content: response.data.svg,
          pdf_url: null
        })
        .select()
        .single();

      if (saveError) throw saveError;
      setCurrentAbstractId(data.id);
      setShowFeedback(true);
    } catch (err) {
      console.error('Error processing files:', err);
      setError(
        err instanceof Error ? err.message : 'An error occurred while processing files'
      );
    } finally {
      setLoading(false);
    }
  };

  const openModal = (template: TemplateType) => {
    setModalTemplate(template);
    setShowModal(true);
  };

  const downloadSvg = () => {
    if (!processedSvg) return;
    console.log(processedSvg, ' is svg in download svg')
    try {
      // Validate and clean SVG
      let cleanSvg = processedSvg.trim();
      
      // Ensure proper XML declaration
      if (!cleanSvg.startsWith('<?xml')) {
        cleanSvg = '<?xml version="1.0" encoding="UTF-8"?>\n' + cleanSvg;
      }

      // Ensure SVG namespace
      if (!cleanSvg.includes('xmlns="http://www.w3.org/2000/svg"')) {
        cleanSvg = cleanSvg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
      }
    console.log(cleanSvg, ' is clean svg in download svg')

      // Create blob and download
      const blob = new Blob([cleanSvg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'visual-abstract.svg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading SVG:', error);
      alert('Error downloading SVG. Please try again.');
    }
  };

  const downloadPng = () => {
    if (!processedSvg) return;
    console.log(processedSvg, ' is svg in download svg')

    try {
      // Clean and validate SVG
      let cleanSvg = processedSvg.trim();
      
      // Ensure proper XML declaration
      if (!cleanSvg.startsWith('<?xml')) {
        cleanSvg = '<?xml version="1.0" encoding="UTF-8"?>\n' + cleanSvg;
      }

      // Ensure SVG namespace
      if (!cleanSvg.includes('xmlns="http://www.w3.org/2000/svg"')) {
        cleanSvg = cleanSvg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
      }

      // Parse SVG to check validity
      const parser = new DOMParser();
      const doc = parser.parseFromString(cleanSvg, 'image/svg+xml');
      if (doc.querySelector('parsererror')) {
        throw new Error('Invalid SVG format');
      }

      // Create image and canvas
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        // Set canvas size to match SVG
        canvas.width = img.width;
        canvas.height = img.height;
        
        if (ctx) {
          // Draw with white background
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);

          // Convert to PNG and download
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = 'visual-abstract.png';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
            }
          }, 'image/png');
        }
      };

      img.onerror = () => {
        throw new Error('Failed to load SVG as image');
      };

      // Load SVG as data URL
      const svgBlob = new Blob([cleanSvg], { type: 'image/svg+xml' });
      img.src = URL.createObjectURL(svgBlob);
    } catch (error) {
      console.error('Error converting to PNG:', error);
      alert('Error converting to PNG. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">PDF to Visual Abstract Converter</h1>
        </div>

        {/* Visual Abstract Samples */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-semibold">Sample Visual Abstracts</h2>
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              title="Show design information"
            >
              <Info className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {showInfo && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Design Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-1">Key Features:</h4>
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    {DESIGN_INFO[selectedTemplate].features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-1">Best For:</h4>
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    {DESIGN_INFO[selectedTemplate].bestFor.map((use, index) => (
                      <li key={index}>{use}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="relative h-[200px]">
            {/* Navigation Arrows */}
            <button
              onClick={() => scrollTo('prev')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-colors"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>
            
            <button
              onClick={() => scrollTo('next')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-colors"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              <ChevronRight className="w-6 h-6 text-gray-700" />
            </button>

            {/* Slideshow Container */}
            <div 
              ref={scrollContainerRef}
              className="relative h-full overflow-hidden"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              <div 
                className="flex transition-transform duration-1000 ease-in-out"
                style={{
                  transform: `translateX(-${currentSlide * slideWidth}px)`,
                }}
              >
                {templates.map(([key, template], index) => (
                  <div
                    key={key}
                    className="w-[300px] flex-shrink-0 px-2"
                  >
                    <div 
                      className="relative h-[180px] cursor-pointer group bg-gray-50 rounded-lg overflow-hidden"
                      onClick={() => openModal(key as TemplateType)}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div 
                          className="w-[300px] h-[180px] flex items-center justify-center"
                          dangerouslySetInnerHTML={{ 
                            __html: SVG_TEMPLATES[key as TemplateType]
                              .replace('viewBox="0 0', 'viewBox="0 50')
                              .replace('width="1200"', 'width="300"')
                              .replace('height="1100"', 'height="180"')
                          }}
                        />
                      </div>
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <h3 className="text-white text-xs font-medium">{template.name}</h3>
                        <p className="text-gray-200 text-[10px] mt-0.5">{template.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal for full-size preview */}
        {showModal && modalTemplate && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm">
              <div 
                ref={modalRef}
                className="fixed inset-4 bg-white rounded-xl shadow-2xl overflow-auto"
              >
                <div className="sticky top-0 z-50 flex justify-end p-4 bg-white/80 backdrop-blur-sm">
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6">
                  <div 
                    className="w-full flex items-center justify-center"
                    dangerouslySetInnerHTML={{ __html: SVG_TEMPLATES[modalTemplate] }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold mb-3">Selected Visual Abstract Style</h2>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value as TemplateType)}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:border-gray-300 focus:ring-0 transition-colors"
                >
                  {templates.map(([key, template]) => (
                    <option key={key} value={key}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div {...getPdfRootProps()} className="border-2 border-dashed border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors cursor-pointer">
            <input {...getPdfInputProps()} />
            <div className="flex flex-col items-center space-y-2">
              <FileText className="w-6 h-6 text-gray-400" />
              <p className="text-sm text-gray-600">Drop PDF file here or click to select</p>
              {pdfFile && <p className="text-xs text-green-600">{pdfFile.name}</p>}
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium mb-3">Custom Visual Abstract Template (Optional)</h3>
            <div {...getSvgRootProps()} className="border-2 border-dashed border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors cursor-pointer">
              <input {...getSvgInputProps()} />
              <div className="flex flex-col items-center space-y-2">
                <Upload className="w-6 h-6 text-gray-400" />
                <p className="text-sm text-gray-600">Drop SVG template here or click to select</p>
                {svgFile && <p className="text-xs text-green-600">{svgFile.name}</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={processFiles}
            disabled={!pdfFile || loading}
            className="flex items-center space-x-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {!loading && (
              <>
                <FileUp className="w-4 h-4" />
                <span>Generate Visual Abstract</span>
              </>
            )}
          </button>
        </div>

        {loading && (
          <div className="mt-6">
            <ProcessingAnimation startTime={Date.now()} />
          </div>
        )}

        {error && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${
            error.startsWith('Processing completed') 
              ? 'bg-green-50 text-green-600' 
              : 'bg-red-50 text-red-600'
          }`}>
            {error}
          </div>
        )}

        {processedSvg && (
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold mb-3">Generated Visual Abstract</h2>
            <div className="border border-gray-100 rounded-lg p-3">
              <div 
                className="w-full flex items-center justify-center"
                dangerouslySetInnerHTML={{ __html: processedSvg }}
              />
            </div>

            <div className="flex gap-3 mt-3">
              <button
                onClick={downloadSvg}
                className="bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors text-sm"
              >
                Download SVG
              </button>

              <button
                onClick={downloadPng}
                className="bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors text-sm"
              >
                Download PNG
              </button>

              <button
                onClick={() => setShowFeedback(true)}
                className="flex items-center gap-2 bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors text-sm"
              >
                <MessageSquare className="w-4 h-4" />
                Give Feedback
              </button>
            </div>

            {showFeedback && currentAbstractId && (
              <FeedbackForm
                visualAbstractId={currentAbstractId}
                onClose={() => setShowFeedback(false)}
                onSubmit={() => {
                  setShowFeedback(false);
                  fetchFeedback(); // Refresh feedback after submission
                }}
              />
            )}
          </div>
        )}

        {/* Testimonials section */}
        {!feedbackLoading && !feedbackError && feedback.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
              What our users say ❤️
            </h2>

            <div className="grid gap-6 md:grid-cols-2">
              {feedback.map((item) => (
                <div 
                  key={item.id} 
                  className="bg-gray-50 p-4 rounded-lg relative"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {[...Array(5)].map((_, i) => (
                      i < item.rating ? (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ) : (
                        <StarOff key={i} className="w-4 h-4 text-gray-300" />
                      )
                    ))}
                  </div>
                  
                  {item.comment && (
                    <p className="text-gray-600 text-sm mb-4">"{item.comment}"</p>
                  )}

                  <div className="flex items-center gap-3 mt-4">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-600 font-medium">
                        {item.user_name?.[0] || 'A'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{item.user_name}</p>
                      <p className="text-gray-500 text-sm">
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {feedbackError && (
          <div className="bg-red-50 border border-red-100 rounded-lg p-4 text-red-600">
            <p>Unable to load feedback: {feedbackError}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default HomePage;