import React, { useState } from 'react';
import { Upload, AlertCircle, FileText, CheckCircle, Download, Shield, Loader } from 'lucide-react';

const App = () => {
  const [step, setStep] = useState('upload');
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

    let fileContent = '';
    try {
      const text = await file.text();
      fileContent = text;
    } catch (err) {
      fileContent = 'Sample discharge summary content for demonstration';
    }

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
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      const fallbackJustification = {
        tier: tier,
        price: tier === 'core' ? 29 : 79,
        reviewed: tier === 'pro',
        content: `MEDICAL NECESSITY JUSTIFICATION\n\nRe: Insurance Claim - Medical Documentation Clarification\n\n[Fallback justification content here...]`
      };
      setJustification(fallbackJustification);
      setStep('justification');
    }
    setLoading(false);
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
      {/* Your full JSX layout goes here */}
    </div>
  );
};

export default App;
