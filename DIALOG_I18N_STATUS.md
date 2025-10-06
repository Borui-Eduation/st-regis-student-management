# Dialog Internationalization Status

## ✅ Completed (2/11)
1. **CreateStudentDialog** - Fully internationalized
2. **EditStudentDialog** - Fully internationalized

## 🔄 In Progress (9/11)

### High Priority (Most Used)
3. **AddEnrollmentDialog** - Used frequently by admins
4. **ChangeStatusDialog** - Critical for workflow
5. **EditGradesDialog** - Used by teachers

### Medium Priority
6. **StudentDetailDialog** - View only, less critical
7. **CreateAgentDialog** - Similar to CreateStudent
8. **AgentDetailDialog** - View only

### Lower Priority
9. **CreateCourseDialog** - Admin only, less frequent
10. **EditCourseDialog** - Admin only, less frequent
11. **MoodleCourseSyncDialog** - Admin only, infrequent

## Translation Files Status
✅ All translation keys prepared in:
- `messages/en.json` - dialogs namespace
- `messages/zh.json` - dialogs namespace

## Next Steps
1. Complete remaining 9 dialog components
2. Each dialog needs:
   - Import `useTranslations`
   - Replace hardcoded strings
   - Test functionality

## Estimated Effort
- ~30-50 changes per dialog
- Total: ~350 remaining changes
