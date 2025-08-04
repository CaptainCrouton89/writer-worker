# Task Completion Checklist

## When a Task is Completed

### Code Quality Checks

- **TypeScript Compilation**: Run `npm run build` to ensure code compiles without errors
- **Type Checking**: Verify all TypeScript types are properly defined
- **No Linting/Formatting Tools**: Currently no ESLint or Prettier configured

### Database Changes

- **SQL Changes**: If database schema was modified:
  1. Use the SQL tool to execute SQL directly on the database
  2. Update local types with `npm run db:types`
- **Complex SQL**: Ensure all column references are fully qualified to avoid PostgreSQL errors, and ensure RLS policies are correctly set

### Testing

- **Manual Testing**: No automated test framework is currently set up
- **Health Check**: Verify service health with `npm run health`
- **Integration Testing**: Test with actual database connections if database changes were made

### Documentation

- **docs/**: Update project documentation if architecture or commands changed
- **Environment Variables**: Document any new required environment variables

### Deployment Preparation

- **Build Success**: Ensure `npm run build` completes successfully
- **Environment Check**: Verify all required environment variables are documented
- **Dependencies**: Ensure package.json dependencies are up to date

### Error Handling

- **Fail Fast**: Verify error handling follows project philosophy (no defensive null checks)
- **Logging**: Ensure proper logging is in place for debugging
- **Retry Logic**: For worker tasks, ensure proper retry mechanisms are implemented

## Pre-Deployment Verification

1. Run `npm run build` - must succeed
2. Check that all environment variables are properly configured
3. Verify database changes are applied using SQL tool
4. Test worker and server startup processes
5. Confirm health endpoint responds correctly
