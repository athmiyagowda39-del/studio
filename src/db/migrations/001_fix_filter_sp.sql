-- This script drops and recreates the usp_FilterLeads stored procedure
-- to be compatible with older versions of SQL Server (2016 and earlier).

-- Drop the existing procedure if it exists
IF OBJECT_ID('usp_FilterLeads', 'P') IS NOT NULL
    DROP PROCEDURE usp_FilterLeads;
GO

-- Create a compatible string splitting function if it doesn't already exist.
-- This is a common workaround for the lack of STRING_SPLIT in older SQL Server versions.
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[fn_SplitString]') AND type IN (N'FN', N'IF', N'TF', N'FS', N'FT'))
BEGIN
EXEC('
CREATE FUNCTION [dbo].[fn_SplitString]
(
    @List NVARCHAR(MAX),
    @Delimiter NVARCHAR(255)
)
RETURNS TABLE
AS
RETURN (
    SELECT Item = LTRIM(RTRIM(y.i.value(''(./text())[1]'', ''nvarchar(4000)'')))
    FROM (
        SELECT x = CONVERT(XML, ''<i>'' + REPLACE(@List, @Delimiter, ''</i><i>'') + ''</i>'').query(''.'')
    ) AS a
    CROSS APPLY x.nodes(''i'') AS y(i)
)
')
END
GO


-- Recreate the stored procedure with compatibility fixes
CREATE PROCEDURE usp_FilterLeads
    @Username NVARCHAR(255) = NULL,
    @UserRole NVARCHAR(50) = NULL,
    @SearchTerm NVARCHAR(255) = NULL,
    @SearchCategory NVARCHAR(50) = NULL,
    @FromDate DATETIME = NULL,
    @ToDate DATETIME = NULL,
    @SelectedModules NVARCHAR(MAX) = NULL,
    @Executive NVARCHAR(255) = NULL,
    @GivenBy NVARCHAR(255) = NULL,
    @Status NVARCHAR(100) = NULL,
    @LeadSubStatus NVARCHAR(100) = NULL,
    @LeadSource NVARCHAR(100) = NULL,
    @ConsiderStatus BIT = 0,
    @FollowUpStatus NVARCHAR(20) = NULL,
    @FollowUpFromDate DATETIME = NULL,
    @FollowUpToDate DATETIME = NULL,
    @FollowUpEnteredBy NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Normalize empty strings or 'all' to NULL for easier filtering
    IF @SearchTerm = '' SET @SearchTerm = NULL;
    IF @SelectedModules = '' SET @SelectedModules = NULL;
    IF @Executive = 'all' SET @Executive = NULL;
    IF @GivenBy = 'all' SET @GivenBy = NULL;
    IF @Status = 'all' SET @Status = NULL;
    IF @LeadSubStatus = 'all' SET @LeadSubStatus = NULL;
    IF @LeadSource = 'all' SET @LeadSource = NULL;
    IF @FollowUpEnteredBy = 'all' SET @FollowUpEnteredBy = NULL;

    SELECT *
    FROM Leads l
    WHERE
        -- Role-based visibility
        (@UserRole != 'Executive' OR l.executive = @Username)

        -- Consider Status filter
        AND (@ConsiderStatus = 0 OR l.status NOT IN ('Order closed', 'Fake', 'Existing Users', 'Not interested'))

        -- Main Search Term filter
        AND (
            @SearchTerm IS NULL OR
            CASE @SearchCategory
                WHEN 'leadId' THEN l.leadId
                WHEN 'company' THEN l.company
                WHEN 'contactPerson' THEN l.contactPerson
                WHEN 'contactNumber' THEN l.contactNumber
                WHEN 'district' THEN l.district
                WHEN 'state' THEN l.state
                WHEN 'email' THEN l.email
                WHEN 'manager' THEN l.manager
                ELSE NULL
            END LIKE '%' + @SearchTerm + '%'
        )

        -- Creation Date range filter
        AND (@FromDate IS NULL OR l.creationDate >= @FromDate)
        AND (@ToDate IS NULL OR l.creationDate <= @ToDate)

        -- Module filter using a custom split function for compatibility
        AND (
            @SelectedModules IS NULL OR EXISTS (
                SELECT 1
                FROM dbo.fn_SplitString(@SelectedModules, ', ') AS filter_mod
                WHERE EXISTS (
                    SELECT 1
                    FROM dbo.fn_SplitString(l.selectedModule, ', ') AS lead_mod
                    WHERE filter_mod.Item = lead_mod.Item
                )
            )
        )

        -- Dropdown filters
        AND (@Executive IS NULL OR l.executive = @Executive)
        AND (@GivenBy IS NULL OR l.givenBy = @GivenBy)
        AND (@Status IS NULL OR l.status = @Status)
        AND (@LeadSubStatus IS NULL OR l.leadSubStatus = @LeadSubStatus)
        AND (@LeadSource IS NULL OR l.reference = @LeadSource)

        -- Follow-up Status filter
        AND (
            @FollowUpStatus IS NULL OR
            (@FollowUpStatus = 'pending' AND l.nextFollowUpDate IS NOT NULL AND TRY_CONVERT(datetime, l.nextFollowUpDate) IS NOT NULL AND TRY_CONVERT(datetime, l.nextFollowUpDate) <= GETUTCDATE()) OR
            (@FollowUpStatus = 'made' AND l.nextFollowUpDate IS NOT NULL AND TRY_CONVERT(datetime, l.nextFollowUpDate) IS NOT NULL AND TRY_CONVERT(datetime, l.nextFollowUpDate) > GETUTCDATE())
        )

        -- Follow-up Date Range filter
        AND (@FollowUpFromDate IS NULL OR (l.nextFollowUpDate IS NOT NULL AND TRY_CONVERT(datetime, l.nextFollowUpDate) IS NOT NULL AND TRY_CONVERT(datetime, l.nextFollowUpDate) >= @FollowUpFromDate))
        AND (@FollowUpToDate IS NULL OR (l.nextFollowUpDate IS NOT NULL AND TRY_CONVERT(datetime, l.nextFollowUpDate) IS NOT NULL AND TRY_CONVERT(datetime, l.nextFollowUpDate) <= @FollowUpToDate))

        -- Follow-up Entered By filter using LIKE for compatibility
        AND (
            @FollowUpEnteredBy IS NULL OR
            l.followUps LIKE '%' + '"enteredBy":"' + @FollowUpEnteredBy + '"' + '%'
        )
    ORDER BY l.creationDate DESC;
END
GO
