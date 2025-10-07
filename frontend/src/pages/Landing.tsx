import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Landing = () => {
  const [activeStep, setActiveStep] = useState(1);

  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      const workflowSection = document.getElementById('workflow-section');
      if (!workflowSection) return;
      
      const rect = workflowSection.getBoundingClientRect();
      const sectionHeight = rect.height;
      const scrollProgress = Math.max(0, Math.min(1, (window.innerHeight - rect.top) / sectionHeight));
      
      if (scrollProgress > 0.8) setActiveStep(4);
      else if (scrollProgress > 0.6) setActiveStep(3);
      else if (scrollProgress > 0.4) setActiveStep(2);
      else if (scrollProgress > 0.2) setActiveStep(1);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="bg-slate-900 text-white">
      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-800"
          style={{
            backgroundImage: 'url(/assets/backgrounds/hero-bg.jpeg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundBlendMode: 'overlay'
          }}
        ></div>
        
        {/* Neural Network Animation Background */}
        <div className="absolute inset-0 opacity-20">
          <img 
            src="/assets/backgrounds/neural-network.jpeg" 
            alt="" 
            className="w-full h-full object-cover animate-pulse"
            onError={(e) => e.currentTarget.style.display = 'none'}
          />
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-emerald-400 rounded-full animate-ping"></div>
          <div className="absolute bottom-1/3 left-1/2 w-1.5 h-1.5 bg-emerald-300 rounded-full animate-pulse"></div>
        </div>
        
        {/* Hero Banner */}
        <div className="absolute right-10 top-1/2 transform -translate-y-1/2 opacity-10 hidden lg:block">
          <img 
            src="/assets/banners/hero-banner.png" 
            alt="" 
            className="w-96 h-auto"
            onError={(e) => e.currentTarget.style.display = 'none'}
          />
        </div>

        <div className="relative z-10 text-center max-w-6xl mx-auto px-6">
          <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
            VERITAS AI: <span className="text-emerald-500">The Digital Truth Engine</span>
          </h1>
          <p className="text-2xl md:text-3xl mb-4 text-slate-300 font-light">
            Stop Fraud in 10 Minutes, Not 10 Days.
          </p>
          <p className="text-xl mb-12 text-slate-400 max-w-4xl mx-auto leading-relaxed">
            A fully automated, forensic AI platform that turns unstructured claims data into an evidence-backed verdict and actionable intelligence.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button className="group relative bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white px-12 py-6 rounded-xl text-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-emerald-500/40 border border-emerald-400/20">
              <span className="relative z-10 flex items-center gap-2">
                <i className="fa-solid fa-calendar-check"></i>
                Request an Executive Demo
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-emerald-300 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            </button>
            <div className="flex gap-4">
              <button 
                onClick={() => navigate('/login')}
                className="group relative bg-transparent border-2 border-emerald-400 text-emerald-400 hover:bg-emerald-400 hover:text-slate-900 px-8 py-6 rounded-xl text-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-emerald-400/30"
              >
                <span className="flex items-center gap-2">
                  <i className="fa-solid fa-sign-in-alt"></i>
                  Sign In
                </span>
              </button>
              <button 
                onClick={() => navigate('/signup')}
                className="group relative bg-gradient-to-r from-slate-100 to-white text-slate-900 hover:from-white hover:to-slate-50 px-8 py-6 rounded-xl text-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-white/20 border border-white/30"
              >
                <span className="flex items-center gap-2">
                  <i className="fa-solid fa-user-plus"></i>
                  Sign Up
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section 
        className="py-24 px-6 relative"
        style={{
          backgroundImage: 'url(/assets/backgrounds/workflow-bg.jpeg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-slate-900 bg-opacity-30"></div>
        <div className="max-w-4xl mx-auto text-center relative z-20">
          <h2 className="text-4xl font-bold mb-8 text-slate-200">
            The Current Reality: Claims Investigation Takes Too Long
          </h2>
          <p className="text-xl text-slate-400 leading-relaxed">
            Insurance executives know the pain: manual reviews, subjective decisions, and weeks of investigation 
            for complex claims. Meanwhile, sophisticated fraud slips through, costing billions annually.
          </p>
        </div>
      </section>

      {/* Interactive Workflow Section */}
      <section 
        id="workflow-section" 
        className="py-24 px-6 bg-slate-800 relative"
        style={{
          backgroundImage: 'url(/assets/backgrounds/workflow-bg.jpeg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-slate-800 bg-opacity-20"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <h2 className="text-5xl font-bold text-center mb-8 text-white">
            The Veritas AI Difference
          </h2>
          <p className="text-center text-slate-400 mb-16 text-lg">
            <i className="fa-solid fa-hand-pointer mr-2"></i>
            Click on any step or scroll to explore the workflow
          </p>
          
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Vertical Timeline */}
            <div className="lg:w-1/3">
              <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-600"></div>
                
                {[1, 2, 3, 4].map((step) => (
                  <div 
                    key={step} 
                    className={`relative flex items-center mb-16 cursor-pointer transition-all duration-300 group ${
                      activeStep === step ? 'opacity-100' : 'opacity-70 hover:opacity-100'
                    }`}
                    onClick={() => setActiveStep(step)}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 transform group-hover:scale-110 ${
                      activeStep === step 
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/50' 
                        : 'bg-slate-600 text-slate-400 hover:bg-emerald-600 hover:text-white hover:shadow-md hover:shadow-emerald-500/30'
                    }`}>
                      {step}
                    </div>
                    <div className="ml-6">
                      <h3 className={`text-xl font-semibold transition-colors duration-300 group-hover:text-emerald-300 ${
                        activeStep === step ? 'text-emerald-400' : 'text-slate-400'
                      }`}>
                        {step === 1 && 'The Claims Gateway'}
                        {step === 2 && 'The AI Pipeline'}
                        {step === 3 && 'The Verdict'}
                        {step === 4 && 'The Co-Pilot'}
                      </h3>
                      {activeStep !== step && (
                        <p className="text-sm text-slate-500 group-hover:text-slate-400 transition-colors duration-300">
                          Click to explore this step
                        </p>
                      )}
                    </div>
                    <div className={`ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                      activeStep === step ? 'hidden' : ''
                    }`}>
                      <i className="fa-solid fa-chevron-right text-emerald-400"></i>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Content Area */}
            <div className="lg:w-2/3">
              <div className="bg-slate-900 rounded-2xl p-8 min-h-96 transition-all duration-500 border border-slate-700 hover:border-slate-600">
                {activeStep === 1 && (
                  <div className="flex items-center gap-8">
                    <div className="flex-1 space-y-6">
                      <h3 className="text-3xl font-bold text-emerald-400">Data In: Zero Learning Curve</h3>
                      <p className="text-xl text-slate-300">
                        Adjusters simply upload claim documents. No training required, no complex interfaces.
                      </p>
                      <div className="flex items-center justify-center gap-6 py-4">
                        <div className="flex flex-col items-center">
                          <i className="fa-solid fa-file-pdf text-2xl text-red-400 mb-1"></i>
                          <span className="text-xs text-slate-400">Documents</span>
                        </div>
                        <i className="fa-solid fa-arrow-right text-lg text-slate-500"></i>
                        <div className="flex flex-col items-center">
                          <i className="fa-solid fa-upload text-2xl text-emerald-500 mb-1"></i>
                          <span className="text-xs text-slate-400">Upload</span>
                        </div>
                      </div>
                    </div>
                    <div className="w-96 h-72 bg-slate-800 rounded-lg border border-slate-600">
                      <img 
                        src="/assets/step-1-gateway.jpeg" 
                        alt="Claims Gateway Interface"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                  </div>
                )}
                
                {activeStep === 2 && (
                  <div className="flex items-center gap-8">
                    <div className="flex-1 space-y-6">
                      <h3 className="text-3xl font-bold text-emerald-400">Intelligence Harvest: Complete Automation</h3>
                      <p className="text-xl text-slate-300">
                        Parallel AI processes extract every detail: text, images, metadata. Textract, Rekognition, and reverse search work simultaneously.
                      </p>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="bg-slate-800 p-3 rounded-lg border border-slate-600">
                          <i className="fa-solid fa-file-text text-xl text-blue-400 mb-1"></i>
                          <p className="text-xs font-semibold">Text Extraction</p>
                        </div>
                        <div className="bg-slate-800 p-3 rounded-lg border border-slate-600">
                          <i className="fa-solid fa-image text-xl text-purple-400 mb-1"></i>
                          <p className="text-xs font-semibold">Image Analysis</p>
                        </div>
                        <div className="bg-slate-800 p-3 rounded-lg border border-slate-600">
                          <i className="fa-solid fa-search text-xl text-emerald-400 mb-1"></i>
                          <p className="text-xs font-semibold">Reverse Search</p>
                        </div>
                      </div>
                    </div>
                    <div className="w-96 h-72 bg-slate-800 rounded-lg border border-slate-600">
                      <img 
                        src="/assets/step-2-pipeline.jpeg" 
                        alt="AI Processing Pipeline"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                  </div>
                )}
                
                {activeStep === 3 && (
                  <div className="flex items-center gap-8">
                    <div className="flex-1 space-y-6">
                      <h3 className="text-3xl font-bold text-emerald-400">Bedrock Connects the Dots: Forensic Protocol</h3>
                      <p className="text-xl text-slate-300">
                        Claude 3 Sonnet processes all data through our Master Prompt, eliminating subjectivity with mathematical precision.
                      </p>
                      <div className="bg-slate-800 p-4 rounded-lg border border-slate-600">
                        <div className="font-mono text-sm bg-slate-900 p-3 rounded">
                          <div className="text-emerald-400">{"{"}</div>
                          <div className="ml-4 text-slate-300">"fraud_score": <span className="text-red-400">92</span>,</div>
                          <div className="ml-4 text-slate-300">"recommendation": "<span className="text-yellow-400">investigate</span>"</div>
                          <div className="text-emerald-400">{"}"}</div>
                        </div>
                      </div>
                    </div>
                    <div className="w-96 h-72 bg-slate-800 rounded-lg border border-slate-600">
                      <img 
                        src="/assets/step-3-verdict.jpeg" 
                        alt="AI Verdict Dashboard"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                  </div>
                )}
                
                {activeStep === 4 && (
                  <div className="flex items-center gap-8">
                    <div className="flex-1 space-y-6">
                      <h3 className="text-3xl font-bold text-emerald-400">Investigator's Cockpit: Evidence-Based Decisions</h3>
                      <p className="text-xl text-slate-300">
                        Amazon Q co-pilot answers deep questions instantly, indexed with all claim data for rapid decision-making.
                      </p>
                      <div className="bg-slate-800 p-4 rounded-lg border border-slate-600">
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <div className="bg-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">Q</div>
                            <div className="bg-slate-700 p-2 rounded-lg flex-1">
                              <p className="text-xs text-slate-200">"Timeline inconsistency?"</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <div className="bg-emerald-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">AI</div>
                            <div className="bg-slate-700 p-2 rounded-lg flex-1">
                              <p className="text-xs text-slate-200">Medical report dated before accident.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="w-96 h-72 bg-slate-800 rounded-lg border border-slate-600">
                      <img 
                        src="/assets/step-4-copilot.jpeg" 
                        alt="AI Co-pilot Interface"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 relative">
        {/* Features Banner */}
        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 opacity-5 hidden xl:block">
          <img 
            src="/assets/banners/features-banner.jpg" 
            alt="" 
            className="w-80 h-auto"
            onError={(e) => e.currentTarget.style.display = 'none'}
          />
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <h2 className="text-5xl font-bold text-center mb-16 text-white">The Verdict</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 hover:border-emerald-500 transition-colors">
              <div className="text-center mb-6">
                <div className="text-6xl font-bold text-emerald-500 mb-2">92%</div>
                <div className="w-full h-2 bg-slate-700 rounded-full">
                  <div className="w-11/12 h-full bg-red-500 rounded-full"></div>
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Fraud Risk Score</h3>
              <p className="text-slate-400">
                Get an instant, mathematically derived fraud confidence score upon analysis completion. No more gut feelings.
              </p>
            </div>

            <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 hover:border-emerald-500 transition-colors">
              <div className="text-center mb-6">
                <i className="fa-solid fa-triangle-exclamation text-6xl text-red-500"></i>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Key Risk Factors</h3>
              <ul className="space-y-2 text-slate-400">
                <li className="flex items-center gap-2">
                  <i className="fa-solid fa-triangle-exclamation text-red-500"></i>
                  Timeline contradictions detected
                </li>
                <li className="flex items-center gap-2">
                  <i className="fa-solid fa-triangle-exclamation text-red-500"></i>
                  Content conflicts identified
                </li>
                <li className="flex items-center gap-2">
                  <i className="fa-solid fa-triangle-exclamation text-red-500"></i>
                  Digital tampering evidence
                </li>
              </ul>
            </div>

            <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 hover:border-emerald-500 transition-colors">
              <div className="text-center mb-6">
                <i className="fa-solid fa-comments text-6xl text-emerald-500"></i>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Conversational Co-Pilot</h3>
              <p className="text-slate-400 mb-4">
                Empower adjusters with an Amazon Q co-pilot, indexed with all claim data, to answer deep-dive questions instantly.
              </p>
              <div className="bg-slate-900 p-3 rounded-lg text-sm">
                <p className="text-emerald-400">"Show me all medical inconsistencies"</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section 
        className="py-24 px-6 bg-gradient-to-r from-indigo-900 to-slate-900 relative"
        style={{
          backgroundImage: 'url(/assets/backgrounds/cta-bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900 to-slate-900 bg-opacity-20"></div>
        {/* Demo Banner */}
        <div className="absolute left-10 top-1/2 transform -translate-y-1/2 opacity-10 hidden lg:block">
          <img 
            src="/assets/banners/demo-banner.png" 
            alt="" 
            className="w-64 h-auto"
            onError={(e) => e.currentTarget.style.display = 'none'}
          />
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-5xl font-bold mb-6 text-white">
            The Era of Guesswork is Over.
          </h2>
          <p className="text-xl mb-12 text-slate-300">
            Schedule a private 15-minute demonstration to see how Veritas AI processes your most complex claim in real-time.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button className="group relative bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 hover:from-emerald-500 hover:via-emerald-400 hover:to-emerald-500 text-white px-16 py-8 rounded-2xl text-2xl font-bold transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-emerald-500/50 border-2 border-emerald-400/30">
              <span className="relative z-10 flex items-center gap-3">
                <i className="fa-solid fa-rocket"></i>
                Secure Your Demo Slot Today
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-emerald-300 rounded-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-2xl opacity-20 group-hover:opacity-40 blur transition-opacity duration-300"></div>
            </button>
            <button 
              onClick={() => navigate('/signup')}
              className="group relative bg-gradient-to-r from-white via-slate-50 to-white hover:from-slate-50 hover:via-white hover:to-slate-50 text-slate-900 px-16 py-8 rounded-2xl text-2xl font-bold transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-white/30 border-2 border-white/50"
            >
              <span className="flex items-center gap-3">
                <i className="fa-solid fa-arrow-right"></i>
                Get Started Free
              </span>
              <div className="absolute -inset-1 bg-gradient-to-r from-white to-slate-100 rounded-2xl opacity-20 group-hover:opacity-40 blur transition-opacity duration-300"></div>
            </button>
          </div>
        </div>
      </section>

      {/* Sticky CTA Banner */}
      <div className="fixed bottom-0 left-0 right-0 bg-emerald-600 text-white p-4 shadow-2xl z-50 lg:hidden">
        <div className="flex items-center justify-between max-w-sm mx-auto">
          <span className="font-semibold">Ready to see Veritas AI?</span>
          <button className="group bg-gradient-to-r from-white to-slate-50 hover:from-slate-50 hover:to-white text-emerald-600 px-6 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-white/30 border border-white/50">
            <span className="flex items-center gap-2">
              <i className="fa-solid fa-play"></i>
              Demo
            </span>
          </button>
        </div>
      </div>


    </div>
  );
};

export default Landing;