# Impeccable - Design Quality Tool

Impeccable has been installed in this project to provide AI-assisted design and UX quality improvements.

## Installation Status

✅ **Installed**: Impeccable skills are installed in `.claude/skills/impeccable/`  
✅ **Agents**: Design agents installed in `.claude/agents/`  
⚠️ **Skill Recognition**: May require Claude Code restart to register skills

## Setup

If `/impeccable` commands aren't working, try:

1. **Restart Claude Code** - New skills require a session restart
2. **Check skill registration**: Skills should appear in the available skills list
3. **Manual invocation**: Use the Skill tool if slash commands don't work

## Available Commands

Once properly registered, you can use these commands:

### Setup & Documentation
- `/impeccable init` - Capture product context in PRODUCT.md (run this first!)
- `/impeccable document` - Generate DESIGN.md from existing code
- `/impeccable extract [target]` - Pull reusable tokens into design system

### Evaluate Design
- `/impeccable critique [target]` - UX design review with scoring
- `/impeccable audit [target]` - Technical quality (a11y, performance, responsive)

### Refine & Polish
- `/impeccable polish [target]` - Final quality pass before shipping
- `/impeccable harden [target]` - Production-ready error handling, i18n
- `/impeccable distill [target]` - Remove unnecessary complexity
- `/impeccable bolder [target]` - Amplify bland designs
- `/impeccable quieter [target]` - Tone down aggressive designs

### Enhance
- `/impeccable animate [target]` - Add purposeful animations
- `/impeccable colorize [target]` - Add strategic color
- `/impeccable typeset [target]` - Improve typography
- `/impeccable layout [target]` - Fix spacing and visual rhythm
- `/impeccable delight [target]` - Add personality and joy

### Fix Issues
- `/impeccable clarify [target]` - Improve UX copy and labels
- `/impeccable adapt [target]` - Responsive design for different screens
- `/impeccable optimize [target]` - Diagnose and fix UI performance

### Other
- `/impeccable shape [feature]` - Plan UX/UI before coding
- `/impeccable live` - Interactive browser variant mode
- `/impeccable hooks <on|off|status>` - Manage design detector hooks
- `/impeccable doctor` - Check for drift in Impeccable artifacts

## Project Context

For this SAT practice app, useful commands would be:

1. **First time setup**: `/impeccable init` to capture product context
2. **Review current design**: `/impeccable critique` for overall UX evaluation
3. **Accessibility check**: `/impeccable audit` for a11y and technical issues
4. **Typography improvements**: `/impeccable typeset` for the question/passage text
5. **Responsive design**: `/impeccable adapt` to ensure mobile optimization
6. **Polish pass**: `/impeccable polish` before major releases

## Design Modes

Impeccable recognizes four design modes:

- **Persuade**: Landing pages, marketing (decide & act)
- **Operate**: App UI, dashboards (complete tasks) ← This app
- **Read**: Docs, articles (understand information)
- **Experience**: Portfolios, galleries (inside the work)

This SAT practice app is primarily **Operate** mode - users complete practice tasks and tests.

## Verification

To verify Impeccable is working:

```bash
# Check installation
npx impeccable help

# Check installed files
ls -la .claude/skills/impeccable/
ls -la .claude/agents/
```

## Documentation

- Official docs: https://impeccable.style/cheatsheet
- Installed reference: `.claude/skills/impeccable/reference/`

## Notes

- Impeccable works best with a running dev server for live inspection
- Commands can target specific files or components with `[target]` argument
- Some commands require browser automation (adapt, audit, optimize)
- The tool integrates with Playwright for UI testing and screenshots
