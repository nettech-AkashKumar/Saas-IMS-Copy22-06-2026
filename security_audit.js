#!/usr/bin/env node

/**
 * Security Audit Scheduler & Compliance Tracker
 * Automates security audits and compliance checks
 * Date: May 5, 2026
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const nodemailer = require('nodemailer');

// Configuration
const CONFIG = {
    auditDirectory: './audits',
    reportDirectory: './reports',
    logDirectory: './logs',
    auditSchedule: {
        daily: ['security-log-review', 'health-check'],
        weekly: ['tenant-isolation-test', 'dependency-check', 'config-review'],
        monthly: ['comprehensive-security-audit', 'penetration-test', 'compliance-check'],
        quarterly: ['architecture-review', 'third-party-assessment']
    },
    complianceFrameworks: ['SOC2', 'ISO27001', 'GDPR', 'CCPA'],
    notificationEmails: [
        'security@imsmymunc.com',
        'dev@imsmymunc.com',
        'compliance@imsmymunc.com'
    ],
    smtpConfig: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    }
};

class SecurityAuditor {
    constructor() {
        this.initializeDirectories();
        this.setupEmailTransporter();
        this.auditHistory = this.loadAuditHistory();
    }

    initializeDirectories() {
        [CONFIG.auditDirectory, CONFIG.reportDirectory, CONFIG.logDirectory].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    setupEmailTransporter() {
        this.transporter = nodemailer.createTransporter(CONFIG.smtpConfig);
    }

    loadAuditHistory() {
        const historyFile = path.join(CONFIG.auditDirectory, 'audit_history.json');
        if (fs.existsSync(historyFile)) {
            return JSON.parse(fs.readFileSync(historyFile, 'utf8'));
        }
        return { audits: [], lastRun: {} };
    }

    saveAuditHistory() {
        const historyFile = path.join(CONFIG.auditDirectory, 'audit_history.json');
        fs.writeFileSync(historyFile, JSON.stringify(this.auditHistory, null, 2));
    }

    async runAudit(auditType, options = {}) {
        const auditId = `${auditType}_${Date.now()}`;
        const startTime = new Date();

        console.log(`🔍 Starting ${auditType} audit...`);

        try {
            const results = await this.executeAudit(auditType, options);

            const auditRecord = {
                id: auditId,
                type: auditType,
                startTime: startTime.toISOString(),
                endTime: new Date().toISOString(),
                status: results.status,
                findings: results.findings,
                recommendations: results.recommendations,
                severity: results.severity || 'LOW'
            };

            // Save detailed report
            this.saveAuditReport(auditRecord);

            // Update history
            this.auditHistory.audits.push(auditRecord);
            this.auditHistory.lastRun[auditType] = new Date().toISOString();
            this.saveAuditHistory();

            // Send notifications for critical findings
            if (results.severity === 'CRITICAL' || results.severity === 'HIGH') {
                await this.sendAuditAlert(auditRecord);
            }

            console.log(`✅ ${auditType} audit completed: ${results.status}`);
            return auditRecord;

        } catch (error) {
            console.error(`❌ ${auditType} audit failed:`, error.message);

            const errorRecord = {
                id: auditId,
                type: auditType,
                startTime: startTime.toISOString(),
                endTime: new Date().toISOString(),
                status: 'FAILED',
                error: error.message,
                severity: 'HIGH'
            };

            await this.sendAuditAlert(errorRecord);
            return errorRecord;
        }
    }

    async executeAudit(auditType, options) {
        switch (auditType) {
            case 'security-log-review':
                return await this.auditSecurityLogs();
            case 'tenant-isolation-test':
                return await this.auditTenantIsolation();
            case 'health-check':
                return await this.auditSystemHealth();
            case 'dependency-check':
                return await this.auditDependencies();
            case 'config-review':
                return await this.auditConfiguration();
            case 'comprehensive-security-audit':
                return await this.comprehensiveSecurityAudit();
            default:
                throw new Error(`Unknown audit type: ${auditType}`);
        }
    }

    async auditSecurityLogs() {
        const findings = [];
        const recommendations = [];

        // Check for tenant isolation breaches
        const breachCount = await this.grepLogs('TENANT ISOLATION BREACH');
        if (breachCount > 0) {
            findings.push({
                type: 'CRITICAL',
                description: `${breachCount} tenant isolation breaches detected`,
                details: 'Immediate security incident investigation required'
            });
        }

        // Check authentication failures
        const authFailures = await this.grepLogs('authentication failed|invalid token');
        if (authFailures > 10) {
            findings.push({
                type: 'HIGH',
                description: `High authentication failure rate: ${authFailures}`,
                details: 'Possible brute force or credential stuffing attack'
            });
        }

        // Check rate limiting
        const rateLimits = await this.grepLogs('rate limit exceeded');
        if (rateLimits > 50) {
            findings.push({
                type: 'MEDIUM',
                description: `High rate limiting activity: ${rateLimits}`,
                details: 'Monitor for DDoS attempts'
            });
        }

        if (findings.length === 0) {
            recommendations.push('Security logs are clean - continue monitoring');
        }

        return {
            status: findings.length === 0 ? 'PASS' : 'ISSUES_FOUND',
            findings,
            recommendations,
            severity: findings.some(f => f.type === 'CRITICAL') ? 'CRITICAL' :
                    findings.some(f => f.type === 'HIGH') ? 'HIGH' : 'LOW'
        };
    }

    async auditTenantIsolation() {
        const findings = [];
        const recommendations = [];

        try {
            // Run tenant isolation tests
            const testResults = await this.runTenantIsolationTests();

            if (!testResults.allPassed) {
                findings.push({
                    type: 'CRITICAL',
                    description: 'Tenant isolation tests failed',
                    details: `Failed tests: ${testResults.failedTests.join(', ')}`
                });
            }

            // Check for cross-tenant data access attempts
            const crossTenantAttempts = await this.grepLogs('cross.tenant|tenant.mismatch');
            if (crossTenantAttempts > 0) {
                findings.push({
                    type: 'HIGH',
                    description: `${crossTenantAttempts} cross-tenant access attempts blocked`,
                    details: 'Security controls are working but attacks are occurring'
                });
            }

        } catch (error) {
            findings.push({
                type: 'CRITICAL',
                description: 'Tenant isolation audit failed',
                details: error.message
            });
        }

        return {
            status: findings.length === 0 ? 'PASS' : 'ISSUES_FOUND',
            findings,
            recommendations,
            severity: findings.some(f => f.type === 'CRITICAL') ? 'CRITICAL' : 'LOW'
        };
    }

    async auditSystemHealth() {
        const findings = [];
        const recommendations = [];

        // Check server status
        const serverStatus = await this.checkServerHealth();
        if (!serverStatus.healthy) {
            findings.push({
                type: 'HIGH',
                description: 'Server health check failed',
                details: serverStatus.details
            });
        }

        // Check database connections
        const dbStatus = await this.checkDatabaseHealth();
        if (!dbStatus.healthy) {
            findings.push({
                type: 'HIGH',
                description: 'Database health check failed',
                details: dbStatus.details
            });
        }

        // Check disk space
        const diskUsage = await this.checkDiskSpace();
        if (diskUsage > 90) {
            findings.push({
                type: 'MEDIUM',
                description: `High disk usage: ${diskUsage}%`,
                details: 'Log rotation or cleanup recommended'
            });
        }

        return {
            status: findings.length === 0 ? 'PASS' : 'ISSUES_FOUND',
            findings,
            recommendations,
            severity: findings.some(f => f.type === 'HIGH') ? 'HIGH' : 'LOW'
        };
    }

    async auditDependencies() {
        const findings = [];
        const recommendations = [];

        try {
            // Check for vulnerable dependencies
            const vulnerabilities = await this.checkVulnerabilities();
            if (vulnerabilities.length > 0) {
                findings.push({
                    type: 'HIGH',
                    description: `${vulnerabilities.length} vulnerable dependencies found`,
                    details: vulnerabilities.join(', ')
                });
                recommendations.push('Update vulnerable dependencies immediately');
            }

            // Check for outdated packages
            const outdated = await this.checkOutdatedPackages();
            if (outdated.length > 10) {
                findings.push({
                    type: 'MEDIUM',
                    description: `${outdated.length} outdated packages`,
                    details: 'Consider updating to latest stable versions'
                });
            }

        } catch (error) {
            findings.push({
                type: 'MEDIUM',
                description: 'Dependency audit failed',
                details: error.message
            });
        }

        return {
            status: findings.length === 0 ? 'PASS' : 'ISSUES_FOUND',
            findings,
            recommendations,
            severity: findings.some(f => f.type === 'HIGH') ? 'HIGH' : 'LOW'
        };
    }

    async auditConfiguration() {
        const findings = [];
        const recommendations = [];

        // Check environment variables
        const envIssues = await this.checkEnvironmentConfig();
        findings.push(...envIssues);

        // Check security configurations
        const securityIssues = await this.checkSecurityConfig();
        findings.push(...securityIssues);

        // Check database configurations
        const dbIssues = await this.checkDatabaseConfig();
        findings.push(...dbIssues);

        return {
            status: findings.length === 0 ? 'PASS' : 'ISSUES_FOUND',
            findings,
            recommendations,
            severity: findings.some(f => f.type === 'CRITICAL') ? 'CRITICAL' :
                    findings.some(f => f.type === 'HIGH') ? 'HIGH' : 'LOW'
        };
    }

    async comprehensiveSecurityAudit() {
        console.log('🔍 Running comprehensive security audit...');

        const results = {
            status: 'PASS',
            findings: [],
            recommendations: [],
            severity: 'LOW'
        };

        // Run all audit types
        const auditTypes = [
            'security-log-review',
            'tenant-isolation-test',
            'health-check',
            'dependency-check',
            'config-review'
        ];

        for (const auditType of auditTypes) {
            try {
                const auditResult = await this.runAudit(auditType, { silent: true });
                results.findings.push(...auditResult.findings);
                results.recommendations.push(...auditResult.recommendations);

                if (auditResult.severity === 'CRITICAL' ||
                    (auditResult.severity === 'HIGH' && results.severity !== 'CRITICAL')) {
                    results.severity = auditResult.severity;
                }
            } catch (error) {
                results.findings.push({
                    type: 'HIGH',
                    description: `${auditType} audit failed`,
                    details: error.message
                });
            }
        }

        if (results.findings.length > 0) {
            results.status = 'ISSUES_FOUND';
        }

        return results;
    }

    // Helper methods
    async grepLogs(pattern) {
        return new Promise((resolve) => {
            exec(`find ${CONFIG.logDirectory} -name "*.log" -exec grep -l "${pattern}" {} \\; | wc -l`,
                (error, stdout) => {
                    resolve(parseInt(stdout.trim()) || 0);
                });
        });
    }

    async runTenantIsolationTests() {
        // This would run the tenant isolation test suite
        return { allPassed: true, failedTests: [] };
    }

    async checkServerHealth() {
        // Implement server health check
        return { healthy: true, details: 'Server responding normally' };
    }

    async checkDatabaseHealth() {
        // Implement database health check
        return { healthy: true, details: 'Database connections healthy' };
    }

    async checkDiskSpace() {
        return new Promise((resolve) => {
            exec('df / | tail -1 | awk \'{print $5}\' | sed \'s/%//\'',
                (error, stdout) => {
                    resolve(parseInt(stdout.trim()) || 0);
                });
        });
    }

    async checkVulnerabilities() {
        // Implement vulnerability scanning
        return [];
    }

    async checkOutdatedPackages() {
        // Implement package outdated check
        return [];
    }

    async checkEnvironmentConfig() {
        // Implement environment config check
        return [];
    }

    async checkSecurityConfig() {
        // Implement security config check
        return [];
    }

    async checkDatabaseConfig() {
        // Implement database config check
        return [];
    }

    saveAuditReport(auditRecord) {
        const reportFile = path.join(CONFIG.reportDirectory,
            `audit_${auditRecord.type}_${auditRecord.id}.json`);
        fs.writeFileSync(reportFile, JSON.stringify(auditRecord, null, 2));
    }

    async sendAuditAlert(auditRecord) {
        const subject = `[${auditRecord.severity}] Security Audit Alert: ${auditRecord.type}`;
        const findings = auditRecord.findings.map(f => `• ${f.type}: ${f.description}`).join('\n');

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #d32f2f;">🚨 Security Audit Alert</h2>
                <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px;">
                    <h3>${auditRecord.type.toUpperCase()}</h3>
                    <p><strong>Status:</strong> ${auditRecord.status}</p>
                    <p><strong>Severity:</strong> ${auditRecord.severity}</p>
                    <p><strong>Time:</strong> ${auditRecord.startTime}</p>
                    ${findings ? `<p><strong>Findings:</strong></p><pre>${findings}</pre>` : ''}
                </div>
            </div>
        `;

        try {
            await this.transporter.sendMail({
                from: CONFIG.smtpConfig.auth.user,
                to: CONFIG.notificationEmails.join(','),
                subject,
                html
            });
            console.log('📧 Audit alert sent');
        } catch (error) {
            console.error('❌ Failed to send audit alert:', error.message);
        }
    }

    async runScheduledAudits() {
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0 = Sunday
        const dayOfMonth = now.getDate();
        const hour = now.getHours();

        // Daily audits (run at 2 AM)
        if (hour === 2) {
            for (const audit of CONFIG.auditSchedule.daily) {
                await this.runAudit(audit);
            }
        }

        // Weekly audits (run on Mondays at 3 AM)
        if (dayOfWeek === 1 && hour === 3) {
            for (const audit of CONFIG.auditSchedule.weekly) {
                await this.runAudit(audit);
            }
        }

        // Monthly audits (run on 1st of month at 4 AM)
        if (dayOfMonth === 1 && hour === 4) {
            for (const audit of CONFIG.auditSchedule.monthly) {
                await this.runAudit(audit);
            }
        }

        // Quarterly audits (run on 1st of Jan, Apr, Jul, Oct at 5 AM)
        if ([1, 4, 7, 10].includes(now.getMonth() + 1) && dayOfMonth === 1 && hour === 5) {
            for (const audit of CONFIG.auditSchedule.quarterly) {
                await this.runAudit(audit);
            }
        }
    }

    generateComplianceReport() {
        const report = {
            generatedAt: new Date().toISOString(),
            complianceFrameworks: CONFIG.complianceFrameworks,
            auditHistory: this.auditHistory,
            overallStatus: this.calculateComplianceStatus(),
            recommendations: this.generateComplianceRecommendations()
        };

        const reportFile = path.join(CONFIG.reportDirectory,
            `compliance_report_${new Date().toISOString().split('T')[0]}.json`);
        fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

        console.log(`📄 Compliance report generated: ${reportFile}`);
        return report;
    }

    calculateComplianceStatus() {
        const recentAudits = this.auditHistory.audits.slice(-10); // Last 10 audits
        const criticalIssues = recentAudits.filter(a => a.severity === 'CRITICAL').length;
        const highIssues = recentAudits.filter(a => a.severity === 'HIGH').length;

        if (criticalIssues > 0) return 'NON_COMPLIANT';
        if (highIssues > 2) return 'AT_RISK';
        return 'COMPLIANT';
    }

    generateComplianceRecommendations() {
        return [
            'Implement automated security testing in CI/CD pipeline',
            'Conduct regular security awareness training',
            'Perform quarterly penetration testing',
            'Maintain comprehensive audit logs for 7+ years',
            'Regular backup and disaster recovery testing',
            'Multi-factor authentication for all admin accounts'
        ];
    }
}

// CLI Interface
async function main() {
    const command = process.argv[2] || 'schedule';
    const auditor = new SecurityAuditor();

    switch (command) {
        case 'run':
            const auditType = process.argv[3] || 'comprehensive-security-audit';
            await auditor.runAudit(auditType);
            break;

        case 'schedule':
            console.log('🔄 Running scheduled audits...');
            await auditor.runScheduledAudits();
            break;

        case 'compliance':
            auditor.generateComplianceReport();
            break;

        case 'daily':
            for (const audit of CONFIG.auditSchedule.daily) {
                await auditor.runAudit(audit);
            }
            break;

        case 'weekly':
            for (const audit of CONFIG.auditSchedule.weekly) {
                await auditor.runAudit(audit);
            }
            break;

        case 'monthly':
            for (const audit of CONFIG.auditSchedule.monthly) {
                await auditor.runAudit(audit);
            }
            break;

        default:
            console.log('Usage: node security_audit.js [run|schedule|compliance|daily|weekly|monthly] [audit-type]');
            console.log('Examples:');
            console.log('  node security_audit.js run tenant-isolation-test');
            console.log('  node security_audit.js schedule');
            console.log('  node security_audit.js compliance');
            process.exit(1);
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = SecurityAuditor;