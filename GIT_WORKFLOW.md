# 🔧 Git Workflow & Best Practices - PRNG Research Project

## 📋 **Project Rules & Standards**

### **Commit Message Convention**
Follow the **Conventional Commits** specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### **Commit Types**
- `feat`: New feature or enhancement
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring without feature changes
- `test`: Adding or updating tests
- `chore`: Maintenance tasks, dependencies, build changes
- `data`: Data collection updates, analysis results
- `analysis`: Statistical analysis, pattern detection updates

#### **Examples**
```bash
feat(collector): add microsecond timing precision for rug events
fix(analysis): correct chi-square test implementation
docs(readme): update installation instructions
data(collection): add 1000+ games from rugs.fun analysis
analysis(patterns): implement cross-game correlation detection
chore(deps): update node.js dependencies to latest versions
```

### **Branch Strategy**

#### **Main Branches**
- `main` - Production-ready code, stable releases
- `develop` - Integration branch for features

#### **Feature Branches**
- `feature/collector-enhancements` - Data collection improvements
- `feature/statistical-analysis` - Analysis framework updates
- `feature/pattern-detection` - ML pattern detection features
- `feature/documentation` - Documentation updates

#### **Naming Convention**
```
feature/<component>-<description>
bugfix/<component>-<issue>
hotfix/<critical-issue>
analysis/<analysis-type>
data/<collection-phase>
```

## 🚀 **Workflow Process**

### **1. Starting New Work**
```bash
# Update main branch
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/collector-enhancements

# Work on your changes...
```

### **2. Making Commits**
```bash
# Stage specific files (avoid git add .)
git add src/enhanced_collector_patch.js
git add docs/implementation_guide.md

# Commit with descriptive message
git commit -m "feat(collector): add real-time pattern detection alerts

- Implement CrossGameSequenceTracker for ML training data
- Add microsecond precision timing for rug events
- Include High Multi → Instarug correlation detection
- Update console display with pattern alerts"

# Push feature branch
git push -u origin feature/collector-enhancements
```

### **3. Code Review Process**
```bash
# Create pull request via GitHub CLI or web interface
gh pr create --title "Enhanced Collector Implementation" \
             --body "Implements real-time pattern detection and ML-ready data collection"

# After review and approval, merge to develop
git checkout develop
git merge feature/collector-enhancements
git push origin develop

# Clean up feature branch
git branch -d feature/collector-enhancements
git push origin --delete feature/collector-enhancements
```

## 📊 **Data Management Rules**

### **Data Collection Commits**
```bash
# Commit data collection milestones
git add data-summaries/
git commit -m "data(collection): milestone 1000 games collected

- Total games: 1,247
- Rug events detected: 156
- Pattern alerts triggered: 23
- Data quality: 99.8% complete
- Collection period: 2025-07-01 to 2025-07-03"
```

### **Analysis Results**
```bash
# Commit analysis findings (not raw data)
git add analysis/statistical-results.md
git add analysis/pattern-detection-summary.json
git commit -m "analysis(patterns): detect significant cross-game correlation

- Chi-square test p-value: 0.0023 (significant)
- High Multi → Instarug correlation: 0.34
- Sample size: 2,500+ games
- Confidence level: 95%"
```

## 🔒 **Security & Privacy Rules**

### **Never Commit**
- Raw game data files (use `.gitignore`)
- API keys or credentials
- Personal information
- Large binary files (>100MB)
- Temporary/cache files

### **Sensitive Data Handling**
```bash
# Use environment variables for sensitive data
echo "RUGS_WEBSOCKET_URL=wss://backend.rugs.fun" >> .env.example
echo "API_KEY=your_api_key_here" >> .env.example

# Never commit actual .env file
echo ".env" >> .gitignore
```

## 📈 **Release Management**

### **Version Tagging**
```bash
# Tag major milestones
git tag -a v1.0.0 -m "Initial data collection system release"
git tag -a v1.1.0 -m "Enhanced pattern detection implementation"
git tag -a v2.0.0 -m "Statistical analysis framework complete"

# Push tags
git push origin --tags
```

### **Release Notes Format**
```markdown
## v1.1.0 - Enhanced Pattern Detection (2025-07-04)

### Added
- Real-time cross-game correlation detection
- Microsecond precision timing for rug events
- ML-ready data structure with comprehensive metadata

### Changed
- Improved console display with pattern alerts
- Enhanced error handling and reconnection logic

### Fixed
- Timing accuracy issues in sequence tracking
- Memory leak in long-running collection sessions
```

## 🔍 **Code Quality Standards**

### **Pre-commit Checks**
```bash
# Run before each commit
npm run lint          # JavaScript linting
python -m flake8      # Python code style
npm test             # Unit tests
node verify-setup.js # System verification
```

### **Pull Request Requirements**
- [ ] All tests passing
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] No sensitive data included
- [ ] Commit messages follow convention
- [ ] Branch is up-to-date with target

## 🚨 **Emergency Procedures**

### **Rollback Process**
```bash
# Rollback to previous stable version
git checkout main
git reset --hard v1.0.0
git push --force-with-lease origin main

# Create hotfix branch for urgent fixes
git checkout -b hotfix/critical-data-loss
```

### **Data Recovery**
```bash
# Recover from backup if data collection fails
cp rugs-data-backup/$(date +%Y%m%d)/* rugs-data/
git add rugs-data-recovery.log
git commit -m "chore(recovery): restore data from backup after collection failure"
```

## 📝 **Documentation Standards**

### **Required Documentation**
- README.md with setup instructions
- API documentation for analysis tools
- Data schema documentation
- Deployment guides
- Troubleshooting guides

### **Documentation Commits**
```bash
git commit -m "docs(api): add statistical analysis function documentation

- Document all PRNG analysis methods
- Include usage examples and parameters
- Add troubleshooting section for common issues"
```

---

**Remember**: Good git practices ensure project continuity, enable collaboration, and maintain data integrity throughout the research process.
