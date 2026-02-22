docs/SECURITY_SCANNING.md

# Vulnerability Scanning & Patching Guide

Complete guide for PayEasy's automated vulnerability scanning and patching system.

## Overview

PayEasy implements a comprehensive multi-layered security scanning approach:

- **Dependency Scanning**: Dependabot for npm/Docker/GitHub Actions
- **SAST**: CodeQL, Semgrep, and Snyk for code analysis
- **DAST**: OWASP ZAP and Nuclei for dynamic testing
- **Container Scanning**: Trivy for image vulnerabilities
- **Secret Detection**: TruffleHog for leaked credentials
- **License Compliance**: FOSSA for dependency licensing
- **Dependency Analysis**: OWASP Dependency Check

## Components

### 1. Dependabot Configuration (`.github/dependabot.yml`)

**Purpose**: Automated dependency updates and vulnerability remediation

**Features**:
- Daily npm dependency scanning
- Weekly Docker image scanning
- Weekly GitHub Actions updates
- Automatic PR creation for patches
- Admin notifications and auto-assignment

**Severity to SLA Mapping**:
- 🔴 Critical: 24 hours
- 🟠 High: 48 hours
- 🟡 Medium: 7 days
- 🟢 Low: 30 days

**Configuration Options**:
```yaml
package-ecosystem: "npm"
schedule:
  interval: "daily"
  time: "03:00"
  timezone: "UTC"
open-pull-requests-limit: 10
```

### 2. SAST Scanning Workflows

#### CodeQL Analysis
- **Language**: JavaScript, TypeScript
- **Database**: Queries for security and quality
- **Results**: GitHub Security code scanning

#### Semgrep
- **Patterns**: OWASP, CWE, custom rules
- **Coverage**: Mobile, Python, JavaScript, TypeScript
- **False Positives**: <2%

#### Snyk
- **Scope**: Dependencies + container images
- **Severity Threshold**: High and Critical
- **Patch Suggestions**: Automatic PR generation

### 3. DAST Scanning Workflows

#### OWASP ZAP
- **Scan Type**: Baseline (fast) or full scan
- **Target**: Staging environment
- **Schedule**: Weekly or on-demand
- **Results**: HTML report + SARIF format

#### Nuclei
- **Templates**: Modern vulnerability scanner
- **Speed**: Fast parallel scanning
- **Coverage**: Web vulnerabilities, API issues
- **Results**: JSON format

### 4. Container Scanning

#### Trivy
- **Target**: Docker images
- **Database**: CVE database (daily updates)
- **Severity**: Critical and High
- **Build Integration**: Fail on critical vulnerabilities

### 5. Secret Detection

#### TruffleHog
- **Scope**: Full repository history
- **Accuracy**: Only verified secrets
- **Prevention**: Blocks commit if secrets detected
- **Recovery**: Remove secrets before push

### 6. Compliance

#### License Scanning (FOSSA)
- **Check**: Copyleft and commercial licenses
- **Report**: License compatibility matrix
- **Alert**: Incompatible license detected

#### Dependency Check
- **Database**: NIST CVE database
- **Scope**: Transitive dependencies
- **Report**: Detailed vulnerability analysis

## Workflow Files

### security-scanning.yml
Main security scanning workflow triggered on:
- Push to main/develop
- Pull requests
- Daily schedule (2 AM UTC)
- Manual trigger

**Jobs**:
1. CodeQL Analysis
2. Snyk Scan
3. Semgrep Analysis
4. Trivy Container Scan
5. License Compliance
6. Secret Scanning
7. Dependency Check
8. Security Summary

### dast-scanning.yml
Dynamic application security testing on:
- Weekly schedule (Monday 3 AM UTC)
- Manual trigger with target URL

**Tests**:
- OWASP ZAP baseline scan
- SSL/TLS certificate validation
- Security headers check
- Nuclei vulnerability patterns
- Lighthouse security audit

### dependency-updates.yml
Handles dependency changes:
- Analyzes package.json changes
- Verifies patch compatibility
- Detects breaking changes
- Checks SLA compliance
- Generates security report

## Alert System

### Alert Channels

1. **GitHub Security Tab**: All scan results
2. **PR Comments**: Automated result summaries
3. **Webhooks**: Custom integrations
4. **Email**: (if configured)
5. **Slack**: (if SLACK_WEBHOOK_URL set)

### Alert Priorities

| Severity | Alert Channel | Auto Response | SLA |
|----------|---------------|---------------|-----|
| Critical | All channels | Create PR + assign | 24h |
| High | GitHub + PR | Create PR + review | 48h |
| Medium | GitHub + PR | Comment only | 7d |
| Low | GitHub only | Silent | 30d |

## SLA Management

### SLA Definitions

**Critical (24-hour SLA)**:
- CVSS Score ≥ 9.0
- Exploitable vulnerability
- Affects production code
- Active exploitation reported

**High (48-hour SLA)**:
- CVSS Score 7.0-8.9
- High-impact vulnerability
- Significant attack surface

**Medium (7-day SLA)**:
- CVSS Score 4.0-6.9
- Moderate risk
- Requires specific conditions

**Low (30-day SLA)**:
- CVSS Score < 4.0
- Minor vulnerability
- Difficult to exploit

### SLA Compliance Tracking

```typescript
// Check SLA status
const slaStatus = getSLAStatus(vulnerability);
// Returns: 'met' | 'at-risk' | 'overdue' | 'patched'

// Calculate compliance rate
const compliance = calculateSLACompliance(vulnerabilities);
// { complianceRate: 97.5, overdueSLA: 2, atRisk: 1 }
```

## Metrics & Reporting

### Key Metrics

1. **Vulnerability Metrics**
   - Total detected
   - By severity (critical, high, medium, low)
   - By source (scanner)
   - By type (dependency, code, container, etc.)
   - Trend analysis

2. **Patch Metrics**
   - Applied patches
   - Pending patches
   - Failed patches
   - Average patch time
   - SLA compliance rate

3. **Scanner Metrics**
   - Last scan time
   - Findings count
   - Scan duration
   - False positive rate
   - Coverage percentage

### Dashboard

Access metrics at:
- GitHub Security tab: https://github.com/Ogstevyn/payeasy/security
- Dependabot: https://github.com/Ogstevyn/payeasy/dependabot
- CodeQL: https://github.com/Ogstevyn/payeasy/security/code-scanning
- Snyk: https://app.snyk.io/ (if integrated)

### Reporting

Generate reports using TypeScript utilities:

```typescript
import { generateMetricsReport } from '@/lib/security/metrics';

const report = generateMetricsReport(metrics);
console.log(report.summary);
// Output: Critical: 1 | High: 3 | Medium: 5 | Low: 2 | Total: 11
```

## Setup Instructions

### 1. Initial Configuration

**Required Secrets** (GitHub Settings > Secrets):
- `SNYK_TOKEN`: From Snyk dashboard
- `FOSSA_API_KEY`: From FOSSA account
- `SLACK_WEBHOOK_URL`: (Optional) For Slack notifications
- `ALERT_WEBHOOK_URL`: (Optional) Custom webhook

**Optional Secrets**:
- `CODEQL_PYTHON_EXCLUSIONS`: Python scan exclusions
- `TRIVY_REGISTRY_USERNAME`: Private registry auth
- `TRIVY_REGISTRY_PASSWORD`: Private registry auth

### 2. Enable Scanning

All workflows are enabled by default. To disable a specific scanner:

Edit `.github/workflows/security-scanning.yml`:
```yaml
codeql:
  ...your config...

# To disable, remove the job or set continue-on-error: true
```

### 3. Configure Dependabot

Review `.github/dependabot.yml`:
- Adjust scan frequency if needed
- Update version constraints
- Set PutRequestPriority options
- Configure auto-merge (if desired)

### 4. Setup Alerts

**For Slack Integration**:
1. Create incoming webhook: https://api.slack.com/apps
2. Add secret `SLACK_WEBHOOK_URL` to GitHub
3. Workflow will automatically post results

**For Email Alerts**:
- Configure via GitHub organization settings
- Or use custom webhook integration

### 5. Test Configuration

Manually trigger a scan:

```bash
# Trigger security scanning workflow
curl -X POST \
  https://api.github.com/repos/Ogstevyn/payeasy/actions/workflows/security-scanning.yml/dispatches \
  -H 'Authorization: token YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"ref":"main"}'
```

## Handling Vulnerabilities

### Workflow

1. **Scan Detects Vulnerability**
   - Severity classified (Critical/High/Medium/Low)
   - SLA timer starts
   - Alert sent to team

2. **Review Period**
   - Security team reviews finding
   - Assesses false positive rate
   - Determines if applicable to PayEasy

3. **Patch Decision**
   - Auto-patch if safe (Dependabot)
   - Manual review if breaking changes
   - Exclude if false positive

4. **Testing**
   - Run automated tests on patch
   - Manual testing if needed
   - Verify no regressions

5. **Deployment**
   - Merge to main (fast-tracked for critical)
   - Deploy to staging first
   - Monitor for issues
   - Deploy to production

6. **Verification**
   - Confirm patch installed
   - Re-scan to verify fix
   - Close related issues

### False Positives

If a scan result is a false positive:

1. Document why it's false positive
2. Request rule exception (if supported)
3. Add to ignore list if needed
4. Report back to scanner maintainers

### Exclusions

To exclude code from scanning:

**ESLint/CodeQL**:
```typescript
// eslint-disable-next-line security/rule-name
vulnerable_code();
```

**Trivy**:
```dockerfile
# trivy:ignore=AVD-DKR-0001
# trivy:skip=CVE-2021-12345
```

**Semgrep**:
```javascript
// nosemgrep: rule-id
risky_operation();
```

## Performance Impact

### Scan Durations

- CodeQL: ~10-15 minutes
- Snyk: ~5-10 minutes
- Semgrep: ~3-5 minutes
- Trivy: ~2-5 minutes
- OWASP ZAP: ~10-30 minutes
- Full workflow: ~30-50 minutes

### Optimization Tips

1. **Parallel Execution**: Most jobs run in parallel
2. **Caching**: Dependencies cached between runs
3. **Incremental Scanning**: Only changed files
4. **Schedule Off-Peak**: Run during low-traffic hours

## Troubleshooting

### Issue: Scan Timeout

**Solution**:
```yaml
timeout-minutes: 60  # Increase job timeout
```

### Issue: False Positives

1. Check scanner configuration
2. Review rule settings
3. Request rule exception
4. Add to ignore list

### Issue: Patch Breaks Build

1. Review patch for breaking changes
2. Update application code
3. Run tests locally before merge
4. Manual test on staging

### Issue: SLA Not Met

1. Expedite review process
2. Auto-merge low-risk patches
3. Schedule emergency patch window
4. Escalate to leadership if critical

## Best Practices

### Development

1. ✅ Run local scanners before push
2. ✅ Use TypeScript strict mode
3. ✅ Avoid dynamic code evaluation
4. ✅ Use parameterized database queries
5. ✅ Validate all user inputs

### Dependency Management

1. ✅ Review dependency updates
2. ✅ Use lockfiles always
3. ✅ Check transitive dependencies
4. ✅ Monitor for new vulnerabilities
5. ✅ Keep dependencies up-to-date

### Code Review

1. ✅ Check security implications
2. ✅ Review dependencies added
3. ✅ Verify no hardcoded secrets
4. ✅ Check for OWASP Top 10
5. ✅ Test security paths

### Patch Management

1. ✅ Patch critical within 24 hours
2. ✅ Test all patches before deployment
3. ✅ Document patch justification
4. ✅ Monitor after deployment
5. ✅ Keep audit trail

## Advanced Usage

### Custom Scanner Integration

Add custom scanner to workflow:

```yaml
- name: Custom Scanner
  run: |
    npm run security:custom-scan
    
  continue-on-error: true
```

### Custom Rules

Create custom Semgrep rules:

```javascript
// In .semgrep.yml
- id: custom-security-rule
  patterns:
    - pattern: insecure_function(...)
  message: "Use secure_function instead"
  severity: ERROR
```

### Webhook Handling

Receive webhook notifications:

```typescript
// In your webhook handler
app.post('/webhook/security', (req, res) => {
  const { severity, package, action } = req.body;
  
  if (severity === 'critical') {
    // Alert team immediately
    alertTeam(`Critical vulnerability in ${package}`);
  }
  
  res.json({ accepted: true });
});
```

## Support & Resources

- **GitHub Security Documentation**: https://docs.github.com/en/code-security
- **Dependabot Docs**: https://docs.github.com/en/code-security/dependabot
- **CodeQL Docs**: https://codeql.github.com/
- **Snyk Documentation**: https://support.snyk.io/
- **OWASP ZAP**: https://www.zaproxy.org/
- **CWE Top 25**: https://cwe.mitre.org/top25/
- **OWASP Top 10**: https://owasp.org/www-project-top-ten/

## FAQ

**Q: How often are scans run?**
A: Dependency scans daily, SAST on every push, DAST weekly, container scans on build.

**Q: Can I disable a specific scanner?**
A: Yes, edit the workflow and remove or comment out the job.

**Q: What if a scan produces false positives?**
A: Document and request exclusion, or add to ignore list.

**Q: How long does a full scan take?**
A: 30-50 minutes depending on codebase size and complexity.

**Q: Can I test locally before pushing?**
A: Yes, install scanners locally (CodeQL CLI, Semgrep, etc.)

**Q: What happens if a critical vulnerability is found?**
A: Immediate alert, escalation, and emergency patch process.

---

**Last Updated**: February 2026  
**Version**: 1.0.0  
**Maintained By**: Security Team  
**Next Review**: May 2026
