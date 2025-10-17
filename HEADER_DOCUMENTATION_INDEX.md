# UnifiedHeader Documentation Index

Welcome to the complete documentation for implementing UnifiedHeader in all Lumiku applications. This index will help you find exactly what you need.

## 📚 Documentation Overview

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **[Quick Reference](./HEADER_QUICK_REFERENCE.md)** | Copy-paste templates | Building a new app, need instant implementation |
| **[Development Standards](./HEADER_DEVELOPMENT_STANDARDS.md)** | Complete guidelines | Deep dive into best practices and standards |
| **[New App Template](./NEW_APP_TEMPLATE.md)** | Full app boilerplate | Starting a new app from scratch |
| **[Contributing Guide](./CONTRIBUTING.md)** | General contribution rules | Submitting PRs, code review process |

---

## 🚀 Quick Start (5 Minutes)

**New to UnifiedHeader?** Start here:

1. **Read**: [Quick Reference](./HEADER_QUICK_REFERENCE.md) (2 min)
2. **Copy**: Template code for your app type
3. **Customize**: Replace app name, icon, and color
4. **Test**: Verify on desktop and mobile
5. **Done**: Submit PR!

---

## 📖 Documentation Guide by Role

### For New Developers

**"I'm building my first Lumiku app"**

1. Start with: [Quick Reference](./HEADER_QUICK_REFERENCE.md)
   - Get the basic template
   - Understand required props
   - See common patterns

2. Then read: [New App Template](./NEW_APP_TEMPLATE.md)
   - Complete app structure
   - API integration patterns
   - State management examples

3. Before PR: [Contributing Guide](./CONTRIBUTING.md)
   - Code review checklist
   - Testing requirements
   - PR template

### For Experienced Developers

**"I know React, just need the standards"**

1. Read: [Development Standards](./HEADER_DEVELOPMENT_STANDARDS.md)
   - All props explained
   - Color scheme standards
   - Anti-patterns to avoid

2. Check: [Quick Reference](./HEADER_QUICK_REFERENCE.md)
   - Copy exact color codes
   - Get icon examples
   - See troubleshooting guide

### For Code Reviewers

**"I'm reviewing a PR with a new app"**

1. Use: [Contributing Guide](./CONTRIBUTING.md) - Header Review Checklist
   - Verify UnifiedHeader usage
   - Check all required props
   - Confirm responsive design

2. Reference: [Development Standards](./HEADER_DEVELOPMENT_STANDARDS.md) - Testing Checklist
   - Visual testing requirements
   - Functional testing items
   - Accessibility checks

### For Designers

**"I need to understand header specifications"**

1. Review: [Development Standards](./HEADER_DEVELOPMENT_STANDARDS.md) - Color Scheme Standards
   - Standard color mappings
   - Contrast requirements
   - App categorization

2. See: [Quick Reference](./HEADER_QUICK_REFERENCE.md) - Icon Library
   - Available icons
   - Icon sizing standards
   - Usage examples

---

## 🎯 Find What You Need

### By Topic

#### **Implementation**
- **Basic Setup**: [Quick Reference](./HEADER_QUICK_REFERENCE.md#30-second-implementation)
- **Complete Template**: [New App Template](./NEW_APP_TEMPLATE.md#complete-template-code)
- **Props Guide**: [Development Standards](./HEADER_DEVELOPMENT_STANDARDS.md#required-vs-optional-props)

#### **Styling**
- **Color Schemes**: [Development Standards](./HEADER_DEVELOPMENT_STANDARDS.md#color-scheme-standards)
- **Color Picker**: [Quick Reference](./HEADER_QUICK_REFERENCE.md#color-picker)
- **Icons**: [Quick Reference](./HEADER_QUICK_REFERENCE.md#icon-library)

#### **Patterns**
- **App List View**: [Quick Reference](./HEADER_QUICK_REFERENCE.md#pattern-app-list-view)
- **Project Detail**: [Quick Reference](./HEADER_QUICK_REFERENCE.md#pattern-project-detail-view)
- **Custom Actions**: [Development Standards](./HEADER_DEVELOPMENT_STANDARDS.md#example-3-header-with-custom-actions-advanced)
- **Sub-Navigation**: [Development Standards](./HEADER_DEVELOPMENT_STANDARDS.md#example-4-sub-navigation-with-unifiedheader)

#### **Mistakes & Solutions**
- **Common Mistakes**: [Development Standards](./HEADER_DEVELOPMENT_STANDARDS.md#common-mistakes-to-avoid)
- **Anti-Patterns**: [Development Standards](./HEADER_DEVELOPMENT_STANDARDS.md#anti-patterns)
- **Troubleshooting**: [Quick Reference](./HEADER_QUICK_REFERENCE.md#troubleshooting)

#### **Testing**
- **Checklist**: [Development Standards](./HEADER_DEVELOPMENT_STANDARDS.md#testing-checklist)
- **Quick Check**: [Quick Reference](./HEADER_QUICK_REFERENCE.md#testing-checklist)
- **Requirements**: [Contributing Guide](./CONTRIBUTING.md#testing-requirements)

### By Question

#### "How do I..."

**...implement UnifiedHeader in a new app?**
→ [Quick Reference - 30-Second Implementation](./HEADER_QUICK_REFERENCE.md#30-second-implementation)

**...choose the right color for my app?**
→ [Development Standards - Color Scheme Standards](./HEADER_DEVELOPMENT_STANDARDS.md#color-scheme-standards)

**...handle navigation between app views?**
→ [Development Standards - Example 2: Project Detail View](./HEADER_DEVELOPMENT_STANDARDS.md#example-2-project-detail-view-with-dynamic-title)

**...add custom action buttons to the header?**
→ [Development Standards - Example 3: Custom Actions](./HEADER_DEVELOPMENT_STANDARDS.md#example-3-header-with-custom-actions-advanced)

**...create an app with multiple tabs?**
→ [Development Standards - Example 4: Sub-Navigation](./HEADER_DEVELOPMENT_STANDARDS.md#example-4-sub-navigation-with-unifiedheader)

**...test my header implementation?**
→ [Development Standards - Testing Checklist](./HEADER_DEVELOPMENT_STANDARDS.md#testing-checklist)

#### "What if..."

**...I want to create a custom header?**
→ ❌ **DON'T!** Read [Anti-Patterns - Creating Custom Headers](./HEADER_DEVELOPMENT_STANDARDS.md#anti-pattern-1-creating-custom-header-components)

**...my app doesn't fit the standard colors?**
→ [Development Standards - Color Selection Rules](./HEADER_DEVELOPMENT_STANDARDS.md#color-selection-rules)

**...I need different navigation logic?**
→ [Development Standards - Common Mistakes #3](./HEADER_DEVELOPMENT_STANDARDS.md#3-hardcoding-dashboard-in-app-list-view)

**...the header doesn't display correctly?**
→ [Quick Reference - Troubleshooting](./HEADER_QUICK_REFERENCE.md#troubleshooting)

---

## 📋 Checklists

### Pre-Development Checklist
- [ ] Read [Quick Reference](./HEADER_QUICK_REFERENCE.md)
- [ ] Choose app color from [color standards](./HEADER_DEVELOPMENT_STANDARDS.md#color-scheme-standards)
- [ ] Select icon from [icon library](./HEADER_QUICK_REFERENCE.md#icon-library)
- [ ] Copy template from [New App Template](./NEW_APP_TEMPLATE.md)

### Pre-PR Checklist
- [ ] UnifiedHeader implemented correctly
- [ ] All required props provided
- [ ] Color scheme follows standards
- [ ] Navigation paths correct
- [ ] Tested on mobile/tablet/desktop
- [ ] No custom headers created
- [ ] Review [Contributing Guide checklist](./CONTRIBUTING.md#header-standards-checklist)

### Code Review Checklist
- [ ] UnifiedHeader is used (not custom header)
- [ ] Icon size is `w-5 h-5`
- [ ] Color uses 50/700 weights
- [ ] `currentAppId` matches app ID
- [ ] Navigation logic correct
- [ ] Responsive design verified
- [ ] No anti-patterns present

---

## 🔍 Search by Error

### Error: "Header not displaying"
**Solution**: [Quick Reference - Troubleshooting](./HEADER_QUICK_REFERENCE.md#troubleshooting)
- Check import path: `../components/UnifiedHeader`
- Verify all required props provided
- Ensure component is rendered

### Error: "App switcher doesn't highlight my app"
**Solution**: [Development Standards - Common Mistakes #2](./HEADER_DEVELOPMENT_STANDARDS.md#2-missing-currentappid)
- Set `currentAppId` prop
- Verify ID matches AVAILABLE_APPS array

### Error: "Colors look wrong"
**Solution**: [Development Standards - Common Mistakes #4](./HEADER_DEVELOPMENT_STANDARDS.md#4-wrong-color-contrast)
- Use exact format: `bg-[color]-50 text-[color]-700`
- Pick from [standard colors](./HEADER_DEVELOPMENT_STANDARDS.md#color-scheme-standards)

### Error: "Back button goes to wrong page"
**Solution**: [Development Standards - Common Mistakes #3](./HEADER_DEVELOPMENT_STANDARDS.md#3-hardcoding-dashboard-in-app-list-view)
- Main app view: `backPath="/dashboard"`
- Detail view: `backPath="/apps/my-app"`

### Error: "Header layout broken on mobile"
**Solution**: [Development Standards - Common Mistakes #5](./HEADER_DEVELOPMENT_STANDARDS.md#5-inconsistent-spacinglayout)
- Use standard container: `max-w-7xl mx-auto px-6 md:px-10`
- Don't override header styles

---

## 📚 Learning Path

### Beginner Path (30 minutes)
1. [Quick Reference](./HEADER_QUICK_REFERENCE.md) - 5 min
2. [New App Template](./NEW_APP_TEMPLATE.md) - Template 1 - 10 min
3. [Development Standards](./HEADER_DEVELOPMENT_STANDARDS.md) - Required Props section - 5 min
4. Practice: Create a simple app - 10 min

### Intermediate Path (1 hour)
1. [Development Standards](./HEADER_DEVELOPMENT_STANDARDS.md) - All examples - 20 min
2. [New App Template](./NEW_APP_TEMPLATE.md) - All templates - 20 min
3. [Contributing Guide](./CONTRIBUTING.md) - Header standards - 10 min
4. Practice: Create app with navigation - 10 min

### Advanced Path (2 hours)
1. Complete [Development Standards](./HEADER_DEVELOPMENT_STANDARDS.md) - 45 min
2. Complete [New App Template](./NEW_APP_TEMPLATE.md) - 30 min
3. Study existing apps in codebase - 30 min
4. Practice: Create complex app with sub-navigation - 15 min

---

## 🛠️ Tools & Resources

### Internal Resources
- **Component Source**: `frontend/src/components/UnifiedHeader.tsx`
- **Example Apps**:
  - `frontend/src/apps/AvatarCreator.tsx`
  - `frontend/src/apps/pose-generator/index.tsx`
  - `frontend/src/apps/VideoMixer.tsx`
  - `frontend/src/apps/CarouselMix.tsx`

### External Resources
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Lucide React Icons](https://lucide.dev/icons)
- [React Router Documentation](https://reactrouter.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Design Resources
- Figma Design System (internal)
- Color Palette Reference (internal)
- Component Library (Storybook - if available)

---

## 🆘 Getting Help

### Self-Help (Try First)
1. Search this documentation index
2. Check [Troubleshooting](./HEADER_QUICK_REFERENCE.md#troubleshooting)
3. Review [Common Mistakes](./HEADER_DEVELOPMENT_STANDARDS.md#common-mistakes-to-avoid)
4. Study example apps in codebase

### Ask the Team
- **Quick Questions**: #frontend-dev Slack
- **Design Questions**: #design Slack
- **Complex Issues**: Create GitHub issue
- **Urgent Problems**: @tech-leads

### Office Hours
- Frontend Team: Tuesdays 2-3 PM
- Design Review: Thursdays 10-11 AM
- Code Review: Daily (async on GitHub)

---

## 📊 Documentation Statistics

| Document | Pages | Read Time | Complexity |
|----------|-------|-----------|------------|
| Quick Reference | 3 | 5 min | Beginner |
| Development Standards | 15 | 30 min | Intermediate |
| New App Template | 12 | 25 min | Intermediate |
| Contributing Guide | 10 | 20 min | All Levels |

**Total Documentation**: 40 pages
**Total Read Time**: ~80 minutes
**Last Updated**: 2025-01-17

---

## 🔄 Version History

### v1.0.0 (2025-01-17)
- Initial documentation release
- Complete UnifiedHeader standards
- Templates and examples
- Code review guidelines

### Future Updates
- Video tutorials (planned)
- Interactive examples (planned)
- Storybook integration (planned)

---

## ✅ Success Criteria

You've successfully learned UnifiedHeader when you can:
- [ ] Implement UnifiedHeader in < 2 minutes
- [ ] Choose appropriate colors without reference
- [ ] Set up navigation paths correctly
- [ ] Debug common issues independently
- [ ] Review others' implementations
- [ ] Create apps following all standards

---

## 🎯 Quick Access Matrix

|  | Quick Setup | Deep Dive | Review | Debug |
|--|-------------|-----------|--------|-------|
| **Props** | [Quick Ref](./HEADER_QUICK_REFERENCE.md#step-2-paste-this-in-your-component) | [Standards](./HEADER_DEVELOPMENT_STANDARDS.md#required-vs-optional-props) | [Contributing](./CONTRIBUTING.md#header-standards-checklist) | [Troubleshoot](./HEADER_QUICK_REFERENCE.md#troubleshooting) |
| **Colors** | [Color Picker](./HEADER_QUICK_REFERENCE.md#color-picker) | [Color Standards](./HEADER_DEVELOPMENT_STANDARDS.md#color-scheme-standards) | - | [Common Mistakes](./HEADER_DEVELOPMENT_STANDARDS.md#4-wrong-color-contrast) |
| **Navigation** | [Patterns](./HEADER_QUICK_REFERENCE.md#common-patterns) | [Examples](./HEADER_DEVELOPMENT_STANDARDS.md#implementation-examples) | - | [Mistakes #3](./HEADER_DEVELOPMENT_STANDARDS.md#3-hardcoding-dashboard-in-app-list-view) |
| **Templates** | [Quick Ref](./HEADER_QUICK_REFERENCE.md#complete-starter-template) | [Full Templates](./NEW_APP_TEMPLATE.md#complete-template-code) | - | - |

---

**Pro Tip**: Bookmark this page and use Ctrl+F to search for exactly what you need!

**Last Updated**: 2025-01-17
**Maintained By**: Lumiku Frontend Team
**Documentation Version**: 1.0.0
