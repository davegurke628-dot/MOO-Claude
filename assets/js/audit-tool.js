/**
 * Marketing Options Online - Website Audit Tool
 * Analyzes websites and provides SEO/performance insights
 */

document.addEventListener('DOMContentLoaded', function() {
  initAuditTool();
});

function initAuditTool() {
  const auditForm = document.getElementById('auditForm');
  if (!auditForm) return;

  auditForm.addEventListener('submit', handleAuditSubmit);
}

async function handleAuditSubmit(e) {
  e.preventDefault();

  const form = e.target;
  const urlInput = document.getElementById('auditUrl');
  const emailInput = document.getElementById('auditEmail');
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;

  const url = urlInput.value.trim();
  const email = emailInput.value.trim();

  // Validate URL
  if (!isValidUrl(url)) {
    window.showToast('Please enter a valid website URL', 'error');
    return;
  }

  // Show loading state
  submitBtn.innerHTML = '<span class="spinner" style="width:20px;height:20px;border-width:2px;"></span> Analyzing...';
  submitBtn.disabled = true;

  try {
    // Simulate API call to analyze website
    const results = await analyzeWebsite(url);

    // Display results
    displayAuditResults(results);

    // Store lead info (in real implementation, send to backend)
    console.log('Lead captured:', { url, email });

    window.showToast('Analysis complete! See your results below.', 'success');
  } catch (error) {
    window.showToast('Unable to analyze website. Please try again.', 'error');
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  }
}

function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

/**
 * Simulated website analysis
 * In production, this would call your backend API which would:
 * - Check SSL certificate
 * - Analyze page speed (using Lighthouse API or similar)
 * - Check mobile responsiveness
 * - Analyze SEO factors
 * - Check security headers
 */
async function analyzeWebsite(url) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 2500));

  // Generate semi-random but realistic results based on URL
  const hash = simpleHash(url);

  // Generate scores (weighted towards realistic values)
  const seoScore = 40 + (hash % 50);
  const speedScore = 30 + ((hash * 2) % 60);
  const mobileScore = 50 + ((hash * 3) % 45);
  const securityScore = 35 + ((hash * 4) % 55);

  const overallScore = Math.round((seoScore + speedScore + mobileScore + securityScore) / 4);

  return {
    url: url,
    overallScore: overallScore,
    metrics: [
      {
        name: 'SEO Score',
        score: seoScore,
        status: getStatus(seoScore),
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>`,
        details: getSEODetails(seoScore)
      },
      {
        name: 'Page Speed',
        score: speedScore,
        status: getStatus(speedScore),
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>`,
        details: getSpeedDetails(speedScore)
      },
      {
        name: 'Mobile Friendly',
        score: mobileScore,
        status: getStatus(mobileScore),
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
          <line x1="12" y1="18" x2="12.01" y2="18"/>
        </svg>`,
        details: getMobileDetails(mobileScore)
      },
      {
        name: 'Security',
        score: securityScore,
        status: getStatus(securityScore),
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>`,
        details: getSecurityDetails(securityScore)
      }
    ],
    recommendations: generateRecommendations(seoScore, speedScore, mobileScore, securityScore)
  };
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function getStatus(score) {
  if (score >= 80) return 'pass';
  if (score >= 50) return 'warn';
  return 'fail';
}

function getStatusLabel(score) {
  if (score >= 80) return 'Good';
  if (score >= 50) return 'Needs Work';
  return 'Poor';
}

function getSEODetails(score) {
  if (score >= 80) return 'Meta tags and structure look good';
  if (score >= 50) return 'Missing some important meta tags';
  return 'Significant SEO improvements needed';
}

function getSpeedDetails(score) {
  if (score >= 80) return 'Page loads quickly';
  if (score >= 50) return 'Page speed could be improved';
  return 'Page loads too slowly';
}

function getMobileDetails(score) {
  if (score >= 80) return 'Fully responsive design';
  if (score >= 50) return 'Some mobile issues detected';
  return 'Not mobile optimized';
}

function getSecurityDetails(score) {
  if (score >= 80) return 'SSL and headers configured';
  if (score >= 50) return 'Some security improvements needed';
  return 'Security vulnerabilities detected';
}

function generateRecommendations(seo, speed, mobile, security) {
  const recommendations = [];

  if (seo < 80) {
    recommendations.push('Add meta descriptions to all pages');
    recommendations.push('Optimize title tags for target keywords');
  }
  if (speed < 80) {
    recommendations.push('Compress and optimize images');
    recommendations.push('Enable browser caching');
  }
  if (mobile < 80) {
    recommendations.push('Make text readable without zooming');
    recommendations.push('Size tap targets appropriately');
  }
  if (security < 80) {
    recommendations.push('Install SSL certificate (HTTPS)');
    recommendations.push('Add security headers');
  }

  return recommendations.slice(0, 4);
}

function displayAuditResults(results) {
  const formWrapper = document.getElementById('auditFormWrapper');
  const resultsWrapper = document.getElementById('auditResults');
  const scoreCircle = document.getElementById('auditScoreCircle');
  const metricsContainer = document.getElementById('auditMetrics');

  if (!formWrapper || !resultsWrapper || !scoreCircle || !metricsContainer) return;

  // Hide form, show results
  formWrapper.style.display = 'none';
  resultsWrapper.classList.add('active');

  // Set score with color
  scoreCircle.textContent = results.overallScore;
  scoreCircle.className = 'audit-score-circle ' + getStatus(results.overallScore);

  // Build metrics HTML
  let metricsHTML = '';
  results.metrics.forEach(metric => {
    metricsHTML += `
      <div class="audit-metric">
        <div class="audit-metric-name">
          ${metric.icon}
          <span>${metric.name}</span>
        </div>
        <div class="audit-metric-status ${metric.status}">
          ${getStatusIcon(metric.status)}
          <span>${metric.score}/100 - ${getStatusLabel(metric.score)}</span>
        </div>
      </div>
    `;
  });

  // Add recommendations
  if (results.recommendations.length > 0) {
    metricsHTML += `
      <div style="margin-top: var(--space-6); padding-top: var(--space-6); border-top: 1px solid var(--border-light);">
        <h4 style="font-size: var(--text-sm); color: var(--slate-700); margin-bottom: var(--space-4);">Top Recommendations:</h4>
        <ul style="list-style: none;">
          ${results.recommendations.map(rec => `
            <li style="display: flex; align-items: flex-start; gap: var(--space-2); margin-bottom: var(--space-2); font-size: var(--text-sm); color: var(--slate-600);">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--gold-500)" stroke-width="2" width="16" height="16" style="flex-shrink: 0; margin-top: 2px;">
                <polyline points="9 11 12 14 22 4"/>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
              ${rec}
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  }

  metricsContainer.innerHTML = metricsHTML;

  // Scroll to results
  resultsWrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function getStatusIcon(status) {
  switch (status) {
    case 'pass':
      return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
        <polyline points="20 6 9 17 4 12"/>
      </svg>`;
    case 'warn':
      return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>`;
    case 'fail':
      return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>`;
    default:
      return '';
  }
}

// Reset audit form (for re-running)
function resetAuditForm() {
  const formWrapper = document.getElementById('auditFormWrapper');
  const resultsWrapper = document.getElementById('auditResults');
  const form = document.getElementById('auditForm');

  if (formWrapper && resultsWrapper && form) {
    formWrapper.style.display = 'block';
    resultsWrapper.classList.remove('active');
    form.reset();

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.innerHTML = `
      Analyze My Website
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    `;
    submitBtn.disabled = false;
  }
}

// Make reset function globally available
window.resetAuditForm = resetAuditForm;
