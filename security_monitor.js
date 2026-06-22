#!/usr/bin/env node

/**
 * Security Monitoring & Alerting System
 * Monitors tenant isolation breaches and security events
 * Date: May 5, 2026
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const nodemailer = require('nodemailer');

// Configuration
const CONFIG = {
    logDirectory: process.env.LOG_DIR || './logs',
    securityLogFile: 'security.log',
    applicationLogFile: 'application.log',
    alertEmail: process.env.ALERT_EMAIL || 'security@imsmymunc.com',
    smtpConfig: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    },
    monitoringInterval: 5 * 60 * 1000, // 5 minutes
    alertThresholds: {
        tenantIsolationBreaches: 1, // Alert on any breach
        authFailures: 10, // Alert if > 10 auth failures in window
        rateLimitHits: 20, // Alert if > 20 rate limit hits in window
        suspiciousRequests: 5 // Alert if > 5 suspicious requests
    }
};

class SecurityMonitor {
    constructor() {
        this.alertsSent = new Set();
        this.lastCheckTime = Date.now();
        this.initializeDirectories();
        this.setupEmailTransporter();
    }

    initializeDirectories() {
        if (!fs.existsSync(CONFIG.logDirectory)) {
            fs.mkdirSync(CONFIG.logDirectory, { recursive: true });
        }
    }

    setupEmailTransporter() {
        this.transporter = nodemailer.createTransporter(CONFIG.smtpConfig);
    }

    async sendAlert(subject, message, severity = 'HIGH') {
        const alertId = `${subject}_${Date.now()}`;

        // Prevent duplicate alerts within short time window
        if (this.alertsSent.has(alertId)) {
            return;
        }

        this.alertsSent.add(alertId);

        // Clear old alerts (keep last 100)
        if (this.alertsSent.size > 100) {
            this.alertsSent.clear();
        }

        console.log(`🚨 [${severity}] ${subject}: ${message}`);

        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #d32f2f;">🚨 Security Alert - ${severity}</h2>
                <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px;">
                    <h3>${subject}</h3>
                    <p><strong>Time:</strong> ${new Date().toISOString()}</p>
                    <p><strong>Details:</strong> ${message}</p>
                    <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
                </div>
                <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 5px;">
                    <p><strong>Recommended Actions:</strong></p>
                    <ul>
                        <li>Review security logs immediately</li>
                        <li>Check for unauthorized access attempts</li>
                        <li>Verify tenant isolation is working</li>
                        <li>Consider blocking suspicious IPs if applicable</li>
                    </ul>
                </div>
            </div>
        `;

        try {
            await this.transporter.sendMail({
                from: CONFIG.smtpConfig.auth.user,
                to: CONFIG.alertEmail,
                subject: `[${severity}] Security Alert: ${subject}`,
                html: emailHtml
            });
            console.log('📧 Alert email sent successfully');
        } catch (error) {
            console.error('❌ Failed to send alert email:', error.message);
        }
    }

    parseLogLine(line) {
        try {
            // Try to parse JSON log entries
            return JSON.parse(line);
        } catch {
            // Parse text log entries
            const timestamp = line.match(/\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]/)?.[1];
            const level = line.match(/\[(ERROR|WARN|INFO)\]/)?.[1];
            const message = line.replace(/^\[.*?\]\s*/, '');

            return {
                timestamp: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
                level: level || 'UNKNOWN',
                message: message || line
            };
        }
    }

    async analyzeSecurityLogs() {
        const securityLogPath = path.join(CONFIG.logDirectory, CONFIG.securityLogFile);
        const appLogPath = path.join(CONFIG.logDirectory, CONFIG.applicationLogFile);

        const now = Date.now();
        const checkWindow = now - this.lastCheckTime;

        let securityEntries = [];
        let appEntries = [];

        // Read security log
        if (fs.existsSync(securityLogPath)) {
            const content = fs.readFileSync(securityLogPath, 'utf8');
            securityEntries = content.split('\n')
                .filter(line => line.trim())
                .map(line => this.parseLogLine(line))
                .filter(entry => {
                    const entryTime = new Date(entry.timestamp).getTime();
                    return entryTime > this.lastCheckTime;
                });
        }

        // Read application log
        if (fs.existsSync(appLogPath)) {
            const content = fs.readFileSync(appLogPath, 'utf8');
            appEntries = content.split('\n')
                .filter(line => line.trim())
                .map(line => this.parseLogLine(line))
                .filter(entry => {
                    const entryTime = new Date(entry.timestamp).getTime();
                    return entryTime > this.lastCheckTime;
                });
        }

        // Combine and analyze entries
        const allEntries = [...securityEntries, ...appEntries];

        this.analyzeEntries(allEntries);
        this.lastCheckTime = now;
    }

    analyzeEntries(entries) {
        let stats = {
            tenantIsolationBreaches: 0,
            authFailures: 0,
            rateLimitHits: 0,
            suspiciousRequests: 0,
            corsViolations: 0,
            hostInjectionAttempts: 0
        };

        entries.forEach(entry => {
            const message = entry.message.toLowerCase();

            // Tenant isolation breaches
            if (message.includes('tenant isolation breach') ||
                message.includes('tenant access violation') ||
                message.includes('tenant mismatch')) {
                stats.tenantIsolationBreaches++;
                this.sendAlert(
                    'TENANT ISOLATION BREACH DETECTED',
                    `Security breach attempt detected. Details: ${entry.message}`,
                    'CRITICAL'
                );
            }

            // Authentication failures
            if (message.includes('authentication failed') ||
                message.includes('invalid token') ||
                message.includes('token expired')) {
                stats.authFailures++;
            }

            // Rate limiting
            if (message.includes('rate limit exceeded') ||
                message.includes('too many requests')) {
                stats.rateLimitHits++;
            }

            // Suspicious requests
            if (message.includes('suspicious') ||
                message.includes('malformed') ||
                message.includes('injection')) {
                stats.suspiciousRequests++;
            }

            // CORS violations
            if (message.includes('not allowed by cors')) {
                stats.corsViolations++;
            }

            // Host header injection attempts
            if (message.includes('host header') ||
                message.includes('host validation failed')) {
                stats.hostInjectionAttempts++;
                this.sendAlert(
                    'HOST HEADER INJECTION ATTEMPT',
                    `Potential host header injection detected: ${entry.message}`,
                    'HIGH'
                );
            }
        });

        // Check thresholds and send alerts
        if (stats.authFailures >= CONFIG.alertThresholds.authFailures) {
            this.sendAlert(
                'HIGH AUTHENTICATION FAILURE RATE',
                `${stats.authFailures} authentication failures detected in last check window`,
                'MEDIUM'
            );
        }

        if (stats.rateLimitHits >= CONFIG.alertThresholds.rateLimitHits) {
            this.sendAlert(
                'HIGH RATE LIMITING ACTIVITY',
                `${stats.rateLimitHits} rate limit hits detected in last check window`,
                'MEDIUM'
            );
        }

        if (stats.suspiciousRequests >= CONFIG.alertThresholds.suspiciousRequests) {
            this.sendAlert(
                'SUSPICIOUS REQUEST ACTIVITY',
                `${stats.suspiciousRequests} suspicious requests detected in last check window`,
                'MEDIUM'
            );
        }

        // Log summary
        console.log(`📊 Security Monitoring Summary (${new Date().toISOString()}):`);
        console.log(`   • Tenant Isolation Breaches: ${stats.tenantIsolationBreaches}`);
        console.log(`   • Auth Failures: ${stats.authFailures}`);
        console.log(`   • Rate Limit Hits: ${stats.rateLimitHits}`);
        console.log(`   • Suspicious Requests: ${stats.suspiciousRequests}`);
        console.log(`   • CORS Violations: ${stats.corsViolations}`);
        console.log(`   • Host Injection Attempts: ${stats.hostInjectionAttempts}`);
    }

    async checkSystemHealth() {
        try {
            // Check if server is running
            const serverCheck = await new Promise((resolve) => {
                exec('curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health || echo "000"',
                    (error, stdout) => {
                        resolve(parseInt(stdout) || 0);
                    });
            });

            if (serverCheck !== 200) {
                this.sendAlert(
                    'SERVER HEALTH CHECK FAILED',
                    `Server returned status ${serverCheck}. Possible outage or configuration issue.`,
                    'HIGH'
                );
            }

            // Check disk space
            const diskCheck = await new Promise((resolve) => {
                exec('df / | tail -1 | awk \'{print $5}\' | sed \'s/%//\'',
                    (error, stdout) => {
                        resolve(parseInt(stdout.trim()) || 0);
                    });
            });

            if (diskCheck > 90) {
                this.sendAlert(
                    'HIGH DISK USAGE',
                    `Disk usage is at ${diskCheck}%. Log rotation or cleanup needed.`,
                    'MEDIUM'
                );
            }

        } catch (error) {
            console.error('Health check error:', error.message);
        }
    }

    async generateSecurityReport() {
        const reportPath = path.join(CONFIG.logDirectory, `security_report_${new Date().toISOString().split('T')[0]}.json`);

        const report = {
            generatedAt: new Date().toISOString(),
            period: {
                from: new Date(this.lastCheckTime).toISOString(),
                to: new Date().toISOString()
            },
            summary: {
                status: 'MONITORING_ACTIVE',
                alertsSent: this.alertsSent.size,
                lastCheck: new Date(this.lastCheckTime).toISOString()
            },
            recommendations: [
                'Review tenant isolation logs regularly',
                'Monitor authentication failure patterns',
                'Check for unusual rate limiting activity',
                'Verify security headers are present on all responses',
                'Ensure regular security testing is performed'
            ]
        };

        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`📄 Security report generated: ${reportPath}`);
    }

    async startMonitoring() {
        console.log('🔍 Starting Security Monitoring System...');
        console.log(`📁 Log Directory: ${CONFIG.logDirectory}`);
        console.log(`📧 Alert Email: ${CONFIG.alertEmail}`);
        console.log(`⏰ Check Interval: ${CONFIG.monitoringInterval / 1000} seconds`);

        // Initial check
        await this.analyzeSecurityLogs();
        await this.checkSystemHealth();
        await this.generateSecurityReport();

        // Set up periodic monitoring
        setInterval(async () => {
            try {
                await this.analyzeSecurityLogs();
                await this.checkSystemHealth();
            } catch (error) {
                console.error('Monitoring error:', error.message);
            }
        }, CONFIG.monitoringInterval);

        // Generate daily report
        setInterval(async () => {
            try {
                await this.generateSecurityReport();
            } catch (error) {
                console.error('Report generation error:', error.message);
            }
        }, 24 * 60 * 60 * 1000); // Daily
    }

    async stopMonitoring() {
        console.log('🛑 Stopping Security Monitoring System...');
        // Cleanup would go here
    }
}

// CLI Interface
async function main() {
    const command = process.argv[2] || 'start';

    const monitor = new SecurityMonitor();

    switch (command) {
        case 'start':
            await monitor.startMonitoring();
            // Keep process running
            process.on('SIGINT', async () => {
                await monitor.stopMonitoring();
                process.exit(0);
            });
            break;

        case 'check':
            await monitor.analyzeSecurityLogs();
            await monitor.checkSystemHealth();
            break;

        case 'report':
            await monitor.generateSecurityReport();
            break;

        case 'test-alert':
            await monitor.sendAlert(
                'TEST ALERT',
                'This is a test security alert to verify email configuration.',
                'LOW'
            );
            break;

        default:
            console.log('Usage: node security_monitor.js [start|check|report|test-alert]');
            console.log('  start    - Start continuous monitoring');
            console.log('  check    - Run one-time security check');
            console.log('  report   - Generate security report');
            console.log('  test-alert - Send test alert email');
            process.exit(1);
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = SecurityMonitor;