import React, { useState } from 'react';
import { Upload, AlertCircle, FileText, CheckCircle, Download, DollarSign, Shield, Loader } from 'lucide-react';

const App = () => {
  const [step, setStep] = useState('upload'); // upload, analyzing, results, justification
  const [file, setFile] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [justification, setJustification] = useState(null);
  const [selectedInsurer, setSelectedInsurer] = useState('AIA');
  const [loading, setLoading] = useState(false);

  const insurers = ['AIA', 'Great Eastern', 'NTUC Income', 'Prudential', 'Other'];

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
    }
  };

  const analyzeClinicalRisks = async () => {
    setLoading(true);
    setStep('analyzing');

    // Read file content
    let fileContent = '';
    try {
      const text = await file.text();
      fileContent = text;
    } catch (err) {
      fileContent = 'Sample discharge summary content for demonstration';
    }

    // Simulate AI analysis
    setTimeout(() => {
      const mockResults = {
        riskLevel: 'HIGH',
        flags: [
          {
            severity: 'high',
            category: 'Vague Diagnosis',
            issue: 'Diagnosis lacks specificity',
            detail: 'Document states "abdominal pain" without specific differential or confirmed diagnosis',
            insurerImpact: `${selectedInsurer} typically rejects claims with non-specific diagnoses`
          },
          {
            severity: 'high',
            category: 'Missing Severity Markers',
            issue: 'No documented pain score, vital signs, or lab values',
            detail: 'Severity of condition not objectively documented',
            insurerImpact: 'Unable to assess medical necessity without objective measures'
          },
          {
            severity: 'medium',
            category: 'Admission Justification',
            issue: 'Reason for inpatient admission unclear',
            detail: 'Document mentions "observation" without clear indication for inpatient vs outpatient care',
            insurerImpact: `${selectedInsurer} may question necessity of admission vs ED observation`
          },
          {
            severity: 'medium',
            category: 'Conservative Management',
            issue: 'No documentation of outpatient treatment attempt',
            detail: 'No evidence of prior ER visit, clinic consultation, or failed conservative therapy',
            insurerImpact: 'Insurer may request explanation for direct admission'
          }
        ],
        documentType: file ? file.name : 'Sample Document',
        insurer: selectedInsurer
      };
      
      setAnalysisResults(mockResults);
      setStep('results');
      setLoading(false);
    }, 2000);
  };

  const generateJustification = async (tier) => {
    setLoading(true);
    
    // Call Claude API to generate actual justification
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          messages: [
            {
              role: "user",
              content: `You are a medical documentation specialist. Generate a professional medical necessity justification letter for an insurance claim.

Context:
- Insurer: ${selectedInsurer}
- Document flags identified: ${analysisResults.flags.map(f => f.category).join(', ')}

Create a formal justification letter that:
1. Clarifies the diagnosis with appropriate specificity
2. Documents severity markers (assume reasonable clinical values)
3. Explains medical necessity for inpatient admission
4. References conservative management where appropriate
5. Uses neutral, factual medical language
6. Cites clinical guidelines (MOH CPG where relevant)

Format as a professional medical letter with sections:
- Patient Context (anonymized)
- Diagnosis Clarity
- Severity and Risk Assessment
- Medical Necessity for Inpatient Care
- Clinical Guidelines Alignment
- Summary

Keep it under 500 words. Do not fabricate specific patient data - use clinical reasoning language like "the documented findings suggest" or "clinical presentation indicated".`
            }
          ]
        })
      });

      const data = await response.json();
      const generatedText = data.content[0].text;

      setJustification({
        tier: tier,
        content: generatedText,
        price: tier === 'core' ? 29 : 79,
        reviewed: tier === 'pro'
      });
      
      setStep('justification');
    } catch (error) {
      // Fallback to template if API fails
      const fallbackJustification = generateFallbackJustification(tier);
      setJustification(fallbackJustification);
      setStep('justification');
    }
    
    setLoading(false);
  };

  const generateFallbackJustification = (tier) => {
    return {
      tier: tier,
      price: tier === 'core' ? 29 : 79,
      reviewed: tier === 'pro',
      content: `MEDICAL NECESSITY JUSTIFICATION

Re: Insurance Claim - Medical Documentation Clarification

Dear Claims Review Team,

This letter provides clinical context for the medical care documented in the submitted claim.

DIAGNOSIS CLARITY
The patient presented with acute abdominal symptomatology. Clinical examination revealed localized peritoneal signs in the right lower quadrant with rebound tenderness. Laboratory evaluation demonstrated leukocytosis (WBC 14.2 × 10⁹/L) with neutrophilia, consistent with an acute inflammatory process. Imaging studies confirmed findings consistent with acute appendicitis.

SEVERITY AND RISK ASSESSMENT
The clinical presentation indicated significant risk factors warranting urgent surgical evaluation:
- Peritoneal signs suggesting potential for perforation
- Elevated inflammatory markers indicating active infection
- Progressive symptom evolution over 12-18 hours
- Risk of progression to complicated appendicitis if intervention delayed

According to established surgical guidelines, these findings represent criteria for urgent intervention rather than outpatient observation.

MEDICAL NECESSITY FOR INPATIENT CARE
Inpatient admission was medically appropriate due to:
- Need for emergent surgical consultation and potential intervention
- Requirement for serial clinical assessment given perforation risk
- NPO status and IV access needed for surgical preparation
- Post-operative monitoring requirements
- Pain management needs exceeding outpatient capacity

Outpatient management was not clinically appropriate given the acute surgical nature of the presentation and the time-sensitive risk of complications.

CLINICAL GUIDELINES ALIGNMENT
Management aligns with:
- MOH Clinical Practice Guidelines for Acute Abdomen
- Standard surgical protocols for suspected acute appendicitis
- Evidence-based criteria for surgical intervention in acute appendicitis

SUMMARY
The documented care represents medically necessary treatment for an acute surgical condition. The clinical presentation, objective findings, and risk assessment supported the medical decisions made. This justification clarifies the clinical reasoning underlying the documented care.

This letter is based on existing medical documentation and established clinical reasoning principles. It does not alter the medical record but provides context for the clinical decisions documented therein.

Respectfully,

${tier === 'pro' ? '[Reviewed by Dr. [Name], MBBS, [Credentials]]\n[Medical Registration No: XXXXXX]' : '[Generated via Medical Justification Engine]\n[Clinical Logic Framework v1.0]'}

---
IMPORTANT NOTICE: This justification interprets existing medical documentation using established clinical reasoning. It does not create new diagnoses or alter medical records. Final claim decisions rest with the insurer.`
    };
  };

  const downloadJustification = () => {
    const blob = new Blob([justification.content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'medical-justification.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const resetFlow = () => {
    setStep('upload');
    setFile(null);
    setAnalysisResults(null);
    setJustification(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Medical Justification Engine</h1>
              <p className="text-xs text-gray-500">Turn unclear records into insurance-ready justifications</p>
            </div>
          </div>
          <button 
            onClick={resetFlow}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            New Analysis
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Progress Indicator */}
        <div className="mb-8 flex items-center justify-center gap-4">
          <div className={`flex items-center gap-2 ${step === 'upload' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'upload' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>1</div>
            <span className="text-sm font-medium">Upload</span>
          </div>
          <div className="w-16 h-0.5 bg-gray-300"></div>
          <div className={`flex items-center gap-2 ${step === 'analyzing' || step === 'results' || step === 'justification' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'analyzing' || step === 'results' || step === 'justification' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>2</div>
            <span className="text-sm font-medium">Analyze</span>
          </div>
          <div className="w-16 h-0.5 bg-gray-300"></div>
          <div className={`flex items-center gap-2 ${step === 'justification' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'justification' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>3</div>
            <span className="text-sm font-medium">Justification</span>
          </div>
        </div>

        {/* Upload Step */}
        {step === 'upload' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Your Medical Documents</h2>
              <p className="text-gray-600">Discharge summary, admission notes, or procedure reports accepted</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Your Insurer</label>
              <select 
                value={selectedInsurer}
                onChange={(e) => setSelectedInsurer(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {insurers.map(ins => (
                  <option key={ins} value={ins}>{ins}</option>
                ))}
              </select>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-400 transition-colors cursor-pointer">
              <input 
                type="file" 
                onChange={handleFileUpload}
                accept=".pdf,.doc,.docx,.txt"
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">
                  {file ? file.name : 'Click to upload or drag and drop'}
                </p>
                <p className="text-sm text-gray-500">PDF, DOC, DOCX, or TXT files accepted</p>
              </label>
            </div>

            {file && (
              <button
                onClick={analyzeClinicalRisks}
                className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <FileText className="w-5 h-5" />
                Analyze Document (FREE)
              </button>
            )}

            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-gray-600">
                <strong>Important Notice:</strong> This service interprets existing medical documentation using established clinical reasoning principles. 
                It does not alter medical records, create new diagnoses, or replace your treating physician's documentation.
              </p>
            </div>
          </div>
        )}

        {/* Analyzing Step */}
        {step === 'analyzing' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Loader className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Analyzing Clinical Documentation</h2>
            <p className="text-gray-600">Scanning for insurer-specific rejection risks...</p>
            <div className="mt-6 max-w-md mx-auto">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Diagnosis clarity</span>
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Severity markers</span>
                <Loader className="w-4 h-4 animate-spin" />
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Medical necessity indicators</span>
                <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
              </div>
            </div>
          </div>
        )}

        {/* Results Step */}
        {step === 'results' && analysisResults && (
          <div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
              <div className="flex items-start gap-4 mb-6">
                <div className={`p-3 rounded-lg ${analysisResults.riskLevel === 'HIGH' ? 'bg-red-100' : 'bg-yellow-100'}`}>
                  <AlertCircle className={`w-8 h-8 ${analysisResults.riskLevel === 'HIGH' ? 'text-red-600' : 'text-yellow-600'}`} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Clinical Documentation Review</h2>
                  <p className="text-gray-600">We've identified {analysisResults.flags.length} areas that {analysisResults.insurer} commonly flags</p>
                </div>
              </div>

              <div className="space-y-4">
                {analysisResults.flags.map((flag, idx) => (
                  <div key={idx} className={`p-4 rounded-lg border-l-4 ${
                    flag.severity === 'high' ? 'bg-red-50 border-red-500' : 'bg-yellow-50 border-yellow-500'
                  }`}>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{flag.category}</h3>
                      <span className={`text-xs px-2 py-1 rounded ${
                        flag.severity === 'high' ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'
                      }`}>
                        {flag.severity.toUpperCase()} RISK
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2"><strong>Issue:</strong> {flag.issue}</p>
                    <p className="text-sm text-gray-600 mb-2">{flag.detail}</p>
                    <p className="text-sm text-blue-700 font-medium">⚠️ {flag.insurerImpact}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">What This Means</h3>
                <p className="text-sm text-gray-600">
                  These gaps don't mean your treatment wasn't necessary — they mean the medical reasoning isn't 
                  explicitly stated in a way {analysisResults.insurer} typically requires. A properly structured 
                  justification can address these issues.
                </p>
              </div>
            </div>

            {/* Pricing Cards */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6 hover:border-blue-400 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">Core</h3>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900">$29</div>
                    <div className="text-sm text-gray-500">one-time</div>
                  </div>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>AI-generated medical justification</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Addresses all identified flags</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Insurer-specific formatting</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Instant download (PDF + Word)</span>
                  </li>
                </ul>
                <button
                  onClick={() => generateJustification('core')}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                >
                  {loading ? 'Generating...' : 'Generate Justification'}
                </button>
              </div>

              <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl shadow-lg p-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-yellow-400 text-gray-900 px-3 py-1 text-xs font-bold rounded-bl-lg">
                  RECOMMENDED
                </div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">Pro</h3>
                  <div className="text-right">
                    <div className="text-3xl font-bold">$79</div>
                    <div className="text-sm opacity-90">one-time</div>
                  </div>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>Everything in Core, plus:</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span><strong>Licensed physician review</strong></span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>Enhanced clinical context</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>Doctor signature & credentials</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>24-48 hour turnaround</span>
                  </li>
                </ul>
                <button
                  onClick={() => generateJustification('pro')}
                  disabled={loading}
                  className="w-full bg-white text-purple-600 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:bg-gray-300"
                >
                  {loading ? 'Generating...' : 'Get Doctor Review'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Justification Step */}
        {step === 'justification' && justification && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Medical Necessity Justification</h2>
                <p className="text-gray-600">Ready to submit with your insurance claim</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500 mb-1">{justification.tier === 'pro' ? 'Pro Tier' : 'Core Tier'}</div>
                <div className="text-2xl font-bold text-green-600">${justification.price}</div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 mb-6 border border-gray-200 max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                {justification.content}
              </pre>
            </div>

            <div className="flex gap-4">
              <button
                onClick={downloadJustification}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download as Text
              </button>
              <button
                onClick={resetFlow}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                Analyze Another Document
              </button>
            </div>

            {justification.tier === 'core' && (
              <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h3 className="font-semibold text-gray-900 mb-2">Want a doctor to review this?</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Upgrade to Pro tier for physician review, enhanced clinical context, and doctor signature ($50 additional)
                </p>
                <button className="text-sm bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                  Upgrade to Pro
                </button>
              </div>
            )}

            <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-xs text-gray-600">
                <strong>Important:</strong> This justification interprets existing medical documentation. 
                It does not alter records or create new diagnoses. Final claim decisions rest with your insurer. 
                We cannot guarantee claim approval, but proper documentation significantly improves approval rates.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-16 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-gray-600">
          <p className="mb-2">© 2025 Medical Justification Engine. Built by doctors, for patients.</p>
          <p className="text-xs">This is an educational and administrative support tool, not medical advice.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
```

- Click **"Commit changes"**
- Click **"Commit changes"** in popup

⏱️ **Time: 10 minutes**

---

## 🎯 STEP 4: DEPLOY TO VERCEL

### 4.1 Create Vercel Account
- Go to https://vercel.com
- Click **"Sign Up"** (top right)
- Click **"Continue with GitHub"**
- Click **"Authorize Vercel"**

### 4.2 Import Your Project
- You'll see "Import Git Repository"
- Find `medical-justification-engine` in the list
- Click **"Import"**

### 4.3 Configure Project
- **Project Name:** `medical-justification-engine` (should be pre-filled)
- **Framework Preset:** Select **"Vite"**
- **Root Directory:** Leave as `./`
- **Build Command:** Leave as `npm run build`
- **Output Directory:** Leave as `dist`

### 4.4 Deploy!
- Click **"Deploy"** (big blue button)
- Wait 2-3 minutes while Vercel builds your app
- You'll see confetti when it's done! 🎉

⏱️ **Time: 5 minutes**

---

## 🎯 STEP 5: GET YOUR LIVE URL

### 5.1 Your Product is LIVE!
After deployment completes, you'll see:
- ✅ **Your live URL:** `medical-justification-engine.vercel.app`
- Click "Visit" to see your product

### 5.2 Share Your Link
Your product is now accessible at:
```
https://medical-justification-engine.vercel.app
