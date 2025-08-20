CREATE PROCEDURE [dbo].[Actitivy_Log_Consult] (
	@LocalADUser nvarchar(255)
) AS
BEGIN

SET NOCOUNT ON

	select
		count(*)
	from
	WHERE
		LocalADUser = @LocalADUser
		and TaskName = 'BUM_LOG_INSERT'
		and Status = 'DONE'
;
END;

/*****************************************************************************************************************************/



CREATE PROCEDURE [dbo].[Activity_Log_Insert] (
	@LocalADUser nvarchar(255),
	@TaskName nvarchar(255),
	@Status nvarchar(255)
) AS
BEGIN

SET NOCOUNT ON

	DECLARE @SeqNumber int
	select @SeqNumber = next value for Activity_Log_Seq;

	INSERT INTO BUDGETTOOL.dbo.Activity_Log
	(LogId, DateInit, DateEnd, LocalADUser, UserName, TaskId, TaskName, Status)
	VALUES(@SeqNumber, GETDATE(), GETDATE(), @LocalADUser, @LocalADUser, @SeqNumber, @TaskName, @Status);
END;

CREATE PROCEDURE [dbo].[All_UsersDelegation_List_Consult] (
	@LocalADUser nvarchar(255),
	@BU_Agrupada nvarchar(255)
) AS
BEGIN
	SET
	NOCOUNT ON
	SELECT
		LocalADUserDel, ubt.UBT_UserName
	FROM
		UsersDelegation ud
	INNER JOIN UsersBudgetTool ubt on ud.LocalADUserDel = ubt.UBT_LocalADUuser
	WHERE
		LocalADUser = @LocalADUser
		AND Status = 'Activo'
		AND GETDATE()>DateInit
		AND GETDATE()<DateEnd
	UNION
	SELECT
			LocalADUserMM, ubt.UBT_UserName
	FROM
			UsersMM um
	INNER JOIN UsersBudgetTool ubt on um.LocalADUserMM = ubt.UBT_LocalADUuser
	WHERE
			LocalADUserPM = @LocalADUser
		AND Status = 'Activo'
		AND GETDATE()>DateInit
		AND GETDATE()<DateEnd
	UNION
	select
		distinct ubt.UBT_LocalADUuser,ubt.UBT_UserName
	from
		UsersBudgetTool ubt
	where
		ubt.BU_Id in (
		select
			BU_Id
		from
			UsersBudgetTool ubt
		where
			UBT_TipoUserId = 'bum'
	and ubt.UBT_LocalADUuser = @LocalADUser
	and ubt.BU_Agrupada = @BU_Agrupada)
	and UBT_LocalADUuser not in (
	select
		ubt2.UBT_LocalADUuser
	from
		UsersBudgetTool ubt2
	where
		UBT_TipoUserId = 'bum' )
	and ubt.UBT_TipoUserId = 'pm'
	UNION
	select
		distinct ubt.UBT_LocalADUuser , ubt.UBT_UserName
	from
		UsersBudgetTool ubt
	where
		UBT_LocalADUuser not in (
		select
			ubt2.UBT_LocalADUuser
		from
			UsersBudgetTool ubt2
		where
			UBT_TipoUserId = 'admin' )
		and 1 = (
			select case when count(*) = 1 then 1 else 0 end
			from UsersBudgetTool ubt3
			where UBT_LocalADUuser = @LocalADUser and ubt3.UBT_TipoUserId = 'ADMIN'
)
;
END;

CREATE PROCEDURE [dbo].[BU_Consult] (
	@BU_Id nvarchar(10) = NULL,
	@COU_Id nvarchar(255) = NULL
) AS
BEGIN

SET NOCOUNT ON

SELECT	BU_Id,
		BU_Name,
		COU_Id
FROM	BU
WHERE	(BU_ID = @BU_ID OR @BU_ID IS NULL)
		AND (COU_Id = @COU_Id OR @COU_Id IS NULL)
ORDER BY BU_Name

END;

/*****************************************************************************************************************************/



CREATE PROCEDURE [dbo].[BudgetTool_ConnectionLdap_Update] (
	@LDAP_Status bit = NULL
) AS
BEGIN

	SET NOCOUNT ON

	DECLARE @CFG_ErrorLDAP BIT
	DECLARE @CFG_AvisoPRCM BIT

SELECT @CFG_ErrorLDAP = CFG_ErrorLDAP,
       @CFG_AvisoPRCM = CFG_AvisoPRCM
FROM Configuration_BudgetTool


UPDATE Configuration_BudgetTool
SET CFG_ErrorLDAP = @LDAP_Status,
    CFG_AvisoPRCM = CASE WHEN @LDAP_Status = 1 THEN 0
                         ELSE 1 END;

SELECT CASE WHEN @CFG_AvisoPRCM = CFG_AvisoPRCM THEN 0
            ELSE 1 END AS sendEmail
FROM Configuration_BudgetTool;

END;

/*****************************************************************************************************************************/



CREATE PROCEDURE [dbo].[BudgetTool_ConnectionMail_Update] (
	@MAIL_Status bit = NULL
) AS
BEGIN

	SET NOCOUNT ON

UPDATE Configuration_BudgetTool
SET CFG_ErrorMail = @MAIL_Status;

END;

/*****************************************************************************************************************************/



CREATE PROCEDURE [dbo].[BudgetTool_Login] (
	@user nvarchar(50) = NULL,
	@password nvarchar(50) = NULL
)
AS
BEGIN

SET NOCOUNT ON

DECLARE @CFG_SendEmail bit

SELECT	@CFG_SendEmail = CFG_SendEmail
FROM	Configuration_BudgetTool

SELECT	UbT_TipoUserId,
		UbT_Id,
        UbT_LocalADUuser,
        BU_AGRUPADA,
		UbT_Mail,
		UBT_UserName,
		ISNULL(@CFG_SendEmail, 0) AS CFG_SendEmail
FROM	UsersBudgetTool
WHERE	(UBT_LocalADUuser = @User)
		AND ISNULL(@User,'') <> ''
		AND UPPER(LTRIM(RTRIM(UbT_UserStatus))) = 'ACTIVE'

END;

/*****************************************************************************************************************************/



CREATE PROCEDURE [dbo].[BudgetTool_UserInfo_Consult](
	@UBT_ID nvarchar(50)
) AS
BEGIN

	SET NOCOUNT ON

SELECT 	(SELECT CONCAT('VERSION: ', version_number) FROM Configuration_BudgetTool) AS version,
          (SELECT CONCAT('ENVIRONMENT: ', environment) FROM Configuration_BudgetTool) AS environment,
          (SELECT TOP 1 CONCAT('USER INFO: ', UBT_UserName,
				  '\nROLES: \n - ',
				  (SELECT STRING_AGG(CONCAT(aux.UBT_TipoUserId, ': ', b.BU_Name), '\n - ')
				  FROM UsersBudgetTool aux LEFT JOIN BU b ON aux.BU_Id  = b.BU_Id WHERE aux.UBT_Id = upt.UBT_id)
				  )
           FROM UsersBudgetTool upt WHERE UBT_Id = @UBT_ID) AS userInfo
END;

/*****************************************************************************************************************************/



CREATE PROCEDURE [dbo].[Bum_CustomerArea_Insert] (
	@COU_ID nvarchar(255),
	@PRINCIPAL_ERP_NUMBER nvarchar(255),
	@PRODUCT_FULL_SEGMENT_NUMBER nvarchar(255),
	@ALPHA_NAME nvarchar(255),
	@UBT_LocalADUuser nvarchar(255),
	@ROY_PERC_CA float,
	@BDG_PERC_CA float,
	@QTY_ROY_CA float,
	@INV_ROY_CA float,
	@GM_ROY_CA float,
	@GM_ROYPERC_CA float,
	@QTY_BDG_CA float,
	@INV_BDG_CA float,
	@GM_BDG_CA float,
	@GM_BDGPERC_CA float,
	@Comments nvarchar(1000)
) AS
BEGIN

SET NOCOUNT ON

	DECLARE @BUAGRUPADA nvarchar(10)
	DECLARE @PRINCIPAL_NAME nvarchar(255)
	DECLARE @PRODUCT_NAME nvarchar(255)
	DECLARE @PRODUCT_TRADE_NAME nvarchar(255)

	SELECT
		DISTINCT @BUAGRUPADA = BU.BU_AGRUPADA
	FROM
		BU
	INNER JOIN UsersBudgetTool ubt on
		BU.BU_ID = ubt.BU_Id
	WHERE
		ubt.UBT_LocalADUuser = @UBT_LocalADUuser;

	DELETE FROM BUM_CUSTOMERAREA WHERE COU_ID = @COU_ID AND PRINCIPAL_ERP_NUMBER = @PRINCIPAL_ERP_NUMBER AND PRODUCT_FULL_SEGMENT_NUMBER = @PRODUCT_FULL_SEGMENT_NUMBER AND ALPHA_NAME  = @ALPHA_NAME AND BUAGRUPADA = @BUAGRUPADA



	SELECT
	@PRINCIPAL_NAME = p.PrincipalName
	FROM
		PRINCIPALS p
	WHERE
		 p.PRINCIPAL_ERP_NUMBER = @PRINCIPAL_ERP_NUMBER;

	select @PRODUCT_NAME = bb.PRODUCT_NAME, @PRODUCT_TRADE_NAME = bb.PRODUCT_TRADE_NAME
	from BUM_BUDGETPRODUCTS bb
	where PRODUCT_FULL_SEGMENT_NUMBER = @PRODUCT_FULL_SEGMENT_NUMBER;

	INSERT INTO BUDGETTOOL.dbo.BUM_CUSTOMERAREA
	(COU_ID, PRINCIPAL_ERP_NUMBER, PRINCIPAL_NAME, PRODUCT_FULL_SEGMENT_NUMBER, PRODUCT_NAME, PRODUCT_TRADE_NAME, ALPHA_NAME, BUAGRUPADA, ROY_PERC_CA, BDG_PERC_CA, QTY_ROY_CA, INV_ROY_CA, GM_ROY_CA, GM_ROYPERC_CA, QTY_BDG_CA, INV_BDG_CA, GM_BDG_CA, GM_BDGPERC_CA, Comments)
	VALUES(@COU_ID,@PRINCIPAL_ERP_NUMBER,@PRINCIPAL_NAME,@PRODUCT_FULL_SEGMENT_NUMBER,@PRODUCT_NAME,@PRODUCT_TRADE_NAME,@ALPHA_NAME,@BUAGRUPADA,@ROY_PERC_CA,@BDG_PERC_CA,@QTY_ROY_CA,@INV_ROY_CA,@GM_ROY_CA,@GM_ROYPERC_CA,@QTY_BDG_CA,@INV_BDG_CA,@GM_BDG_CA,@GM_BDGPERC_CA, @Comments);

END;

CREATE PROCEDURE [dbo].[BUM_Principals_Consult] (
	@COU_Id nvarchar(255),
	@BU_Agrupada nvarchar(255),
	@UBT_LocalADUuser nvarchar(255)
) AS
BEGIN

SET NOCOUNT ON

select
distinct p.PrincipalName as name, CAST (PRINCIPAL_ERP_NUMBER AS nvarchar(255)) as id
from
	PRINCIPALS p
INNER JOIN UsersBudgetTool ubt on p.BU_Agrupada = ubt.BU_Agrupada
INNER JOIN COUNTRIES c on
	p.COU_COMPANY = c.COU_COMPANY
INNER JOIN BU b on
p.BU_Agrupada = b.BU_Agrupada and c.COU_Id = b.COU_Id and ubt.BU_Id = b.BU_Id
where
	c.COU_ID = @COU_Id
	and p.PRINCIPAL_ERP_NUMBER is not null
	and b.BU_Agrupada = @BU_Agrupada
	and ubt.UBT_LocalADUuser = @UBT_LocalADUuser
	and ubt.UBT_TipoUserId = 'BUM'
	order by p.PrincipalName
;


END;



END;

CREATE PROCEDURE [dbo].[Bum_TradeName_Consult] (
	@PRODUCT_FULL_SEGMENT_NUMBER nvarchar(255),
	@BU_AGRUPADA nvarchar(255),
	@COU_ID nvarchar(255)
) AS
BEGIN

SET NOCOUNT ON

select p.Principal_ERP_Number as 'select-principal',bt.Comments as 'Comments',bt.QTY_ROY,bt.INV_ROY,bt.GM_ROY,bt.GM_ROYPERC,bt.QTY_BDG,bt.INV_BDG,bt.GM_BDG,bt.GM_BDGPERC
FROM BUM_TRADENAME bt
INNER JOIN BUM_BUDGETPRODUCTS bb on bt.PRODUCT_FULL_SEGMENT_NUMBER = bb.PRODUCT_FULL_SEGMENT_NUMBER
INNER JOIN PRINCIPALS p on p.PRINCIPAL_ERP_NUMBER = bb.PRINCIPAL_ERP_NUMBER and bt.BUAGRUPADA = p.BU_Agrupada
INNER JOIN Countries c on p.COU_Company = c.COU_Company and bt.COU_ID = c.COU_Id
where bt.PRODUCT_FULL_SEGMENT_NUMBER = @PRODUCT_FULL_SEGMENT_NUMBER and bt.BUAGRUPADA = @BU_AGRUPADA and c.COU_Id = @COU_ID;

END;

/*****************************************************************************************************************************/



CREATE PROCEDURE [dbo].[Bum_TradeName_Insert] (
	@COU_ID nvarchar(10),
	@PRINCIPAL_ERP_NUMBER nvarchar(255),
	@PRODUCT_FULL_SEGMENT_NUMBER nvarchar(255),
	@UBT_LocalADUuser nvarchar(255),
	@QTY_ROY float,
	@INV_ROY float,
	@GM_ROY float,
	@GM_ROYPERC float,
	@QTY_BDG float,
	@INV_BDG float,
	@GM_BDG float,
	@GM_BDGPERC float,
	@Comments nvarchar(1000)
) AS
BEGIN
	SET
	NOCOUNT ON
	DECLARE @BUAGRUPADA nvarchar(10)
	DECLARE @PRINCIPAL_NAME nvarchar(255)

	SELECT
		DISTINCT @BUAGRUPADA = BU.BU_AGRUPADA
	FROM
		BU
	INNER JOIN UsersBudgetTool ubt on
		BU.BU_ID = ubt.BU_Id
	WHERE
		ubt.UBT_LocalADUuser = @UBT_LocalADUuser;

	SELECT
	@PRINCIPAL_NAME = p.PrincipalName
	FROM
		PRINCIPALS p
	WHERE
		 p.PRINCIPAL_ERP_NUMBER = @PRINCIPAL_ERP_NUMBER;

	INSERT INTO BUM_TRADENAME (COU_ID,PRINCIPAL_ERP_NUMBER,PRINCIPAL_NAME,PRODUCT_FULL_SEGMENT_NUMBER,BUAGRUPADA,QTY_ROY,INV_ROY,GM_ROY,GM_ROYPERC,QTY_BDG,INV_BDG,GM_BDG,GM_BDGPERC, Comments)
	VALUES (@COU_ID, @PRINCIPAL_ERP_NUMBER, @PRINCIPAL_NAME, @PRODUCT_FULL_SEGMENT_NUMBER, @BUAGRUPADA, @QTY_ROY, @INV_ROY, @GM_ROY, @GM_ROYPERC, @QTY_BDG, @INV_BDG, @GM_BDG, @GM_BDGPERC, @Comments)

END;

/*****************************************************************************************************************************/



CREATE PROCEDURE [dbo].[Bum_TradeName_List_Consult] (
	@COU_Id int,
	@BU_AGRUPADA nvarchar(255)
) AS
BEGIN

SET NOCOUNT ON

select bbp.PRODUCT_TRADE_NAME as name, btn.PRODUCT_FULL_SEGMENT_NUMBER as id
from Bum_TradeName btn
INNER JOIN Bum_BudgetProducts bbp on btn.PRODUCT_FULL_SEGMENT_NUMBER = bbp.PRODUCT_FULL_SEGMENT_NUMBER
INNER JOIN Countries c on btn.COU_ID = c.COU_Id
WHERE btn.COU_ID = @COU_Id and btn.BUAGRUPADA = @BU_AGRUPADA;
;


END;

/*****************************************************************************************************************************/



CREATE PROCEDURE [dbo].[Bum_TradeName_Update] (
	@COU_ID nvarchar(10),
	@PRINCIPAL_ERP_NUMBER nvarchar(255),
	@PRODUCT_FULL_SEGMENT_NUMBER nvarchar(255),
	@UBT_LocalADUuser nvarchar(255),
	@QTY_ROY float,
	@INV_ROY float,
	@GM_ROY float,
	@GM_ROYPERC float,
	@QTY_BDG float,
	@INV_BDG float,
	@GM_BDG float,
	@GM_BDGPERC float,
	@Comments nvarchar(1000)
) AS
BEGIN

SET NOCOUNT ON

DECLARE @BUAGRUPADA nvarchar(10)


SELECT
	DISTINCT @BUAGRUPADA = BU.BU_AGRUPADA
FROM
	BU
INNER JOIN UsersBudgetTool ubt on
	BU.BU_ID = ubt.BU_Id
WHERE
	ubt.UBT_LocalADUuser = @UBT_LocalADUuser;

UPDATE BUM_TRADENAME
SET
	QTY_ROY = @QTY_ROY,
	INV_ROY = @INV_ROY,
	GM_ROY = @GM_ROY,
	GM_ROYPERC = @GM_ROYPERC,
	QTY_BDG = @QTY_BDG,
	INV_BDG = @INV_BDG,
	GM_BDG = @GM_BDG,
	GM_BDGPERC = @GM_BDGPERC,
	Comments = @Comments
WHERE
	COU_ID = @COU_ID AND
	PRINCIPAL_ERP_NUMBER = @PRINCIPAL_ERP_NUMBER AND
	PRODUCT_FULL_SEGMENT_NUMBER = @PRODUCT_FULL_SEGMENT_NUMBER AND
	BUAGRUPADA = @BUAGRUPADA

END;

CREATE PROCEDURE [dbo].[BUM_UsersDelegation_List_Consult] (
	@LocalADUser nvarchar(255)
) AS
BEGIN
	SET
	NOCOUNT ON
	select
	distinct ubt.UBT_LocalADUuser, ubt.UBT_UserName
from
	UsersBudgetTool ubt
where
	UBT_LocalADUuser not in (
	select
		ubt2.UBT_LocalADUuser
	from
		UsersBudgetTool ubt2
	where
		UBT_TipoUserId = 'admin' )
	and 1 = (
		select case when count(*) = 1 then 1 else 0 end
		from UsersBudgetTool ubt3
		where UBT_LocalADUuser = @LocalADUser and ubt3.UBT_TipoUserId = 'ADMIN'
)
	and ubt.UBT_TipoUserId = 'BUM'
;

END;


CREATE PROCEDURE [dbo].[Configuration_AlertMessage_Consult] (
 	@idMensaje varchar(50) = NULL
 )
 AS
 BEGIN
 SELECT  cam.CAM_Title,
         cam.CAM_Body,
         cam.CAM_Icon,
         cam.CAM_Buttons,
         cam.CAM_Button1,
         cam.CAM_Button2,
         cam.CAM_DangerMode,
         cam.CAM_Type
 FROM Configuration_AlertMessage cam WHERE CAM_IdMessage = @idMensaje;
 END;

 /*****************************************************************************************************************************/



CREATE PROCEDURE [dbo].[Configuration_Consult]
AS
BEGIN
    SET NOCOUNT ON
SELECT	Configuration_BudgetTool.*
FROM	Configuration_BudgetTool
END;

/*****************************************************************************************************************************/



CREATE PROCEDURE [dbo].[Configuration_Message_Consult] (
	@idMensaje varchar(50) = NULL
)
AS
BEGIN
SELECT
    (SELECT STRING_AGG(ct.CT_IdStoreProcedure,';') FROM Configuration_Tags ct WHERE  cm.CM_To LIKE '%'+ct.CT_TagName+'%') AS 'to',
        (SELECT STRING_AGG(ct.CT_IdStoreProcedure,';') FROM Configuration_Tags ct WHERE  cm.CM_CC LIKE '%'+ct.CT_TagName+'%') AS 'cc',
        (SELECT STRING_AGG(ct.CT_IdStoreProcedure,';') FROM Configuration_Tags ct WHERE  cm.CM_BCC LIKE '%'+ct.CT_TagName+'%') AS 'bcc',
        cm.CM_Subject AS 'subject',
        cm.CM_Body AS 'body'
FROM Configuration_Message cm WHERE CM_IdMessage = @idMensaje;
END;

/*****************************************************************************************************************************/



CREATE PROCEDURE [dbo].[Configuration_Tags_Consult] (
	@nombreTag varchar(max) = NULL
)
AS
BEGIN
SELECT ct.CT_IdStoreProcedure
FROM Configuration_Tags ct
WHERE ct.CT_TagName  LIKE '%'+@nombreTag +'%';
END;

/*****************************************************************************************************************************/



CREATE PROCEDURE [dbo].[Countries_byUser_Consult] (
	@UbT_LocalADUuser nvarchar(255)
) AS
BEGIN

SET NOCOUNT ON

select distinct c.COU_ID as id, c.COU_COMPANY as name
from UsersBudgetTool ubt
INNER JOIN BU b on b.BU_ID = ubt.BU_Id
INNER JOIN COUNTRIES c on b.COU_ID = c.COU_ID
where ubt.UBT_LocalADUuser = @UbT_LocalADUuser


END;

/*****************************************************************************************************************************/



CREATE PROCEDURE [dbo].[Countries_Consult] (
	@COU_Id nvarchar(20) = NULL
) AS
BEGIN

SET NOCOUNT ON

SELECT	COU_Id,
		COU_Company,
		COU_Acronim
FROM	Countries
WHERE	(COU_Id = @COU_Id OR @COU_Id IS NULL)
ORDER BY COU_Id

END;

/*****************************************************************************************************************************/



CREATE PROCEDURE [dbo].[CustomerArea_Consult] (
	@COU_ID nvarchar(255),
	@PRINCIPAL_ERP_NUMBER nvarchar(255),
	@PRODUCT_FULL_SEGMENT_NUMBER nvarchar(255),
	@BUAGRUPADA nvarchar(255)
) AS
BEGIN

SET NOCOUNT ON

	SELECT distinct ALPHA_NAME,
	ROY_PERC_CA,
	BDG_PERC_CA,
	QTY_ROY_CA,
	INV_ROY_CA,
	GM_ROY_CA,
	GM_ROYPERC_CA,
	QTY_BDG_CA,
	INV_BDG_CA,
	GM_BDG_CA,
	GM_BDGPERC_CA
	FROM BUM_CUSTOMERAREA bc
	INNER JOIN COUNTRIES c on bc.COU_ID = c.COU_ID
	INNER JOIN PRINCIPALS p on bc.PRINCIPAL_ERP_NUMBER = p.PRINCIPAL_ERP_NUMBER and p.COU_COMPANY = c.COU_COMPANY
	INNER JOIN BUM_TRADENAME bt on bt.PRODUCT_FULL_SEGMENT_NUMBER = bc.PRODUCT_FULL_SEGMENT_NUMBER
	WHERE
	c.COU_ID = @COU_ID AND
	bt.PRINCIPAL_ERP_NUMBER = @PRINCIPAL_ERP_NUMBER AND
	bt.PRODUCT_FULL_SEGMENT_NUMBER = @PRODUCT_FULL_SEGMENT_NUMBER
	and bc.BUAGRUPADA = @BUAGRUPADA;
END;

/*****************************************************************************************************************************/



CREATE PROCEDURE [dbo].[CustomerArea_List_Consult] (
	@COU_Id integer,
	@UBT_LocalADUuser nvarchar(255)
) AS
BEGIN

SET NOCOUNT ON

select
	DISTINCT ALPHA_NAME as name
from
	UsersBudgetTool ubt
	INNER JOIN BUM_BUDGETSR bb on ubt.BU_Id = bb.BU_ID
WHERE ubt.UBT_LocalADUuser = @UBT_LocalADUuser and bb.COU_ID = @COU_Id
END;

CREATE PROCEDURE [dbo].[PM_Principals_Actual_Status] (
	@COU_Id nvarchar(255),
	@BU_Agrupada nvarchar(255),
	@UBT_LocalADUuser nvarchar(255)
) AS
BEGIN

SET NOCOUNT ON

SELECT
	distinct
	p.PrincipalName as name,
	sum(pp.checked) as checked,
	count(pp.PRINCIPAL_REPORTING_LINE) as total_reporting_line
from
	PRINCIPALS p
INNER JOIN COUNTRIES c on
	p.COU_COMPANY = c.COU_COMPANY
INNER JOIN BU b on
	p.BU_Agrupada = b.BU_Agrupada
	and c.COU_Id = b.COU_Id
INNER JOIN Pm_Process pp on p.Principal_ERP_Number = pp.PRINCIPAL_ERP_NUMBER and pp.COMPANY = c.COU_Company
INNER JOIN UsersBudgetTool ubt on pp.PMNAME = ubt.UBT_Id and b.BU_Id = ubt.BU_Id
WHERE
	c.COU_Id = @COU_Id
	and p.BU_Agrupada = @BU_Agrupada
	and ubt.UBT_LocalADUuser = @UBT_LocalADUuser
	and ubt.UBT_TipoUserId = 'PM'
GROUP by
p.PrincipalName
END;

CREATE PROCEDURE [dbo].[PM_Principals_Consult] (
	@COU_Id nvarchar(255),
	@BU_Agrupada nvarchar(255),
	@UBT_LocalADUuser nvarchar(255),
	@CHECKED int,
	@ROL nvarchar(255)
) AS
BEGIN

SET NOCOUNT ON

if (@ROL = 'PM')


SELECT
	DISTINCT
	p.PrincipalName as name,
	CAST (p.PRINCIPAL_ERP_NUMBER AS nvarchar(255)) as id
from
	PRINCIPALS p
INNER JOIN COUNTRIES c on
	p.COU_COMPANY = c.COU_COMPANY
INNER JOIN BU b on
	p.BU_Agrupada = b.BU_Agrupada
	and c.COU_Id = b.COU_Id
INNER JOIN Pm_Process pp on p.Principal_ERP_Number = pp.PRINCIPAL_ERP_NUMBER and pp.COMPANY = c.COU_Company
INNER JOIN UsersBudgetTool ubt on pp.PMNAME = ubt.UBT_Id and b.BU_Id = ubt.BU_Id
where
	c.COU_ID = @COU_Id
	and b.BU_Agrupada = @BU_Agrupada
	and ubt.UBT_LocalADUuser = @UBT_LocalADUuser
	and ubt.UBT_TipoUserId = 'PM'
	and pp.checked = @CHECKED
	and p.PRINCIPAL_ERP_NUMBER is not null
ORDER BY
	p.PrincipalName
;


ELSE

SELECT
	distinct
	p.PrincipalName as name,
	CAST (p.PRINCIPAL_ERP_NUMBER AS nvarchar(255)) as id
from
	Pm_Process pp
INNER JOIN Principals p on
	pp.PRINCIPAL_ERP_NUMBER = p.Principal_ERP_Number
INNER JOIN Countries c on
	p.COU_Company = c.COU_Company
	and pp.COMPANY = c.COU_Company
INNER JOIN UsersBudgetTool ubt on
	pp.PMNAME = ubt.UBT_Id
INNER JOIN BU b on
	b.BU_ID = ubt.BU_Id
	and b.COU_Id = c.COU_Id
WHERE
	c.COU_Id = @COU_Id
	and p.BU_Agrupada = @BU_Agrupada
	and ubt.UBT_TipoUserId = 'PM'
	and pp.checked = @CHECKED
	and ubt.UBT_LocalADUuser in (
	select
		distinct ubt.UBT_LocalADUuser
	from
		UsersBudgetTool ubt
	where
		ubt.BU_Id in (
		select
			BU_Id
		from
			UsersBudgetTool ubt
		where
			ubt.BU_Agrupada = @BU_Agrupada
	)
		and ubt.UBT_TipoUserId = 'PM'
	)
	ORDER BY
	p.PrincipalName
;

END;

CREATE PROCEDURE [dbo].[PM_Principals_Repline_Consult] (
	@COU_Id nvarchar(255),
	@BU_Agrupada nvarchar(255),
	@UBT_LocalADUuser nvarchar(255),
	@PRINCIPAL_ERP_NUMBER nvarchar(255),
	@PRINCIPAL_REPORTING_LINE nvarchar(255),
	@ROL nvarchar(255)
) AS
BEGIN

SET
	NOCOUNT ON
	if(@ROL = 'PM')
		select
		distinct
		[YTD_QTY] as 'REP_LINE/YTD/tableRepLineHistData/QTY',
		[YTD_%GM] as 'REP_LINE/YTD/tableRepLineHistData/GMPERC',
		[YTD_INV] as 'REP_LINE/YTD/tableRepLineHistData/INV',
		[YTD_GM] as 'REP_LINE/YTD/tableRepLineHistData/GM',
		[VAR%_YTD_QTY] as 'REP_LINE/YTD/tableRepLineHistData/VAR',
		[L12_QTY] as 'REP_LINE/L12/tableRepLineHistData/QTY',
		[L12_ %GM] as 'REP_LINE/L12/tableRepLineHistData/GMPERC',
		[L12_INV] as 'REP_LINE/L12/tableRepLineHistData/INV',
		[L12_GM] as 'REP_LINE/L12/tableRepLineHistData/GM',
		[VAR%_L12_QTY] as 'REP_LINE/L12/tableRepLineHistData/VAR',
		[Lyr_QTY] as 'REP_LINE/Lyr/tableRepLineHistData/QTY',
		[LYR_ %GM] as 'REP_LINE/Lyr/tableRepLineHistData/GMPERC',
		[Lyr_INV] as 'REP_LINE/Lyr/tableRepLineHistData/INV',
		[Lyr_GM] as 'REP_LINE/Lyr/tableRepLineHistData/GM',
		[ROY_LYR_QTY] as 'REP_LINE/ROY Lyr/tableRepLineRoy/QTY',
		[ROY_LYR_GM%] as 'REP_LINE/ROY Lyr/tableRepLineRoy/GMPERC',
		[ROY_LYR_INV] as 'REP_LINE/ROY Lyr/tableRepLineRoy/INV',
		[ROY_LYR_GM] as 'REP_LINE/ROY Lyr/tableRepLineRoy/GM',
		[ROY_LYR_VAR%_QTY] as 'REP_LINE/ROY Lyr/tableRepLineRoy/VAR',
		[ROY_QTY_MGT] as 'REP_LINE/Mgment Proposal/tableRepLineRoy/QTY',
		[ROY_GM%_MGT] as 'REP_LINE/Mgment Proposal/tableRepLineRoy/GMPERC',
		[ROY_INV_MGT] as 'REP_LINE/Mgment Proposal/tableRepLineRoy/INV',
		[ROY_GM_MGT] as 'REP_LINE/Mgment Proposal/tableRepLineRoy/GM',
		[VAR%_ROY_QTY_MGT] as 'REP_LINE/Mgment Proposal/tableRepLineRoy/VAR',
		[ROY_QTY_PM] as 'REP_LINE/PM Proposal/tableRepLineRoy/QTY',
		[ROY_GM%_PM] as 'REP_LINE/PM Proposal/tableRepLineRoy/GMPERC',
		[ROY_INV_PM] as 'REP_LINE/PM Proposal/tableRepLineRoy/INV',
		[ROY_GM_PM] as 'REP_LINE/PM Proposal/tableRepLineRoy/GM',
		[FCS_QTY] as 'REP_LINE/FCS/tableRepLineBDG/QTY',
		[FCS_GM%] as 'REP_LINE/FCS/tableRepLineBDG/GMPERC',
		[FCS_INV] as 'REP_LINE/FCS/tableRepLineBDG/INV',
		[FCS_GM] as 'REP_LINE/FCS/tableRepLineBDG/GM',
		[VAR%_FCS_QTY] as 'REP_LINE/FCS/tableRepLineBDG/VAR',
		[BDG_QTY_MGT] as 'REP_LINE/Mgment Proposal/tableRepLineBDG/QTY',
		[BDG_GM%_MGT] as 'REP_LINE/Mgment Proposal/tableRepLineBDG/GMPERC',
		[BDG_INV_MGT] as 'REP_LINE/Mgment Proposal/tableRepLineBDG/INV',
		[BDG_GM_MGT] as 'REP_LINE/Mgment Proposal/tableRepLineBDG/GM',
		[VAR%_BDG_QTY_MGT] as 'REP_LINE/Mgment Proposal/tableRepLineBDG/VAR',
		[BDG_QTY_PM] as 'REP_LINE/PM Proposal/tableRepLineBDG/QTY',
		[BDG_GM%_PM] as 'REP_LINE/PM Proposal/tableRepLineBDG/GMPERC',
		[BDG_INV_PM] as 'REP_LINE/PM Proposal/tableRepLineBDG/INV',
		[BDG_GM_PM] as 'REP_LINE/PM Proposal/tableRepLineBDG/GM',
		pp.MONTH_LOST as 'select-month',
		pp.COMMENTS as 'comments-lostProduct'

	from
		Pm_Process pp
	INNER JOIN Principals p on
		pp.PRINCIPAL_ERP_NUMBER = p.Principal_ERP_Number
	INNER JOIN Countries c on
		p.COU_Company = c.COU_Company
		and pp.COMPANY = c.COU_Company
	INNER JOIN UsersBudgetTool ubt on
		pp.PMNAME = ubt.UBT_Id
	INNER JOIN BU b on
		b.BU_ID = ubt.BU_Id
		and b.COU_Id = c.COU_Id
	WHERE
		c.COU_Id = @COU_Id
		and p.BU_Agrupada = @BU_Agrupada
		and ubt.UBT_LocalADUuser = @UBT_LocalADUuser
		and ubt.UBT_TipoUserId = 'PM'
		AND p.PRINCIPAL_ERP_NUMBER = @PRINCIPAL_ERP_NUMBER
		and pp.PRINCIPAL_REPORTING_LINE = @PRINCIPAL_REPORTING_LINE;

	ELSE
	select
	sum(distinct [YTD_QTY]) as 'REP_LINE/YTD/tableRepLineHistData/QTY',
	sum(distinct [YTD_%GM]) as 'REP_LINE/YTD/tableRepLineHistData/GMPERC',
	sum(distinct [YTD_INV]) as 'REP_LINE/YTD/tableRepLineHistData/INV',
	sum(distinct [YTD_GM]) as 'REP_LINE/YTD/tableRepLineHistData/GM',
	sum(distinct [VAR%_YTD_QTY]) as 'REP_LINE/YTD/tableRepLineHistData/VAR',
	sum(distinct [L12_QTY]) as 'REP_LINE/L12/tableRepLineHistData/QTY',
	sum(distinct [L12_ %GM]) as 'REP_LINE/L12/tableRepLineHistData/GMPERC',
	sum(distinct [L12_INV]) as 'REP_LINE/L12/tableRepLineHistData/INV',
	sum(distinct [L12_GM]) as 'REP_LINE/L12/tableRepLineHistData/GM',
	sum(distinct [VAR%_L12_QTY]) as 'REP_LINE/L12/tableRepLineHistData/VAR',
	sum(distinct [Lyr_QTY]) as 'REP_LINE/Lyr/tableRepLineHistData/QTY',
	sum(distinct [LYR_ %GM]) as 'REP_LINE/Lyr/tableRepLineHistData/GMPERC',
	sum(distinct [Lyr_INV]) as 'REP_LINE/Lyr/tableRepLineHistData/INV',
	sum(distinct [Lyr_GM]) as 'REP_LINE/Lyr/tableRepLineHistData/GM',
	sum(distinct [ROY_LYR_QTY]) as 'REP_LINE/ROY Lyr/tableRepLineRoy/QTY',
	sum(distinct [ROY_LYR_GM%]) as 'REP_LINE/ROY Lyr/tableRepLineRoy/GMPERC',
	sum(distinct [ROY_LYR_INV]) as 'REP_LINE/ROY Lyr/tableRepLineRoy/INV',
	sum(distinct [ROY_LYR_GM]) as 'REP_LINE/ROY Lyr/tableRepLineRoy/GM',
	sum(distinct [ROY_LYR_VAR%_QTY]) as 'REP_LINE/ROY Lyr/tableRepLineRoy/VAR',
	sum(distinct [ROY_QTY_MGT]) as 'REP_LINE/Mgment Proposal/tableRepLineRoy/QTY',
	sum(distinct [ROY_GM%_MGT]) as 'REP_LINE/Mgment Proposal/tableRepLineRoy/GMPERC',
	sum(distinct [ROY_INV_MGT]) as 'REP_LINE/Mgment Proposal/tableRepLineRoy/INV',
	sum(distinct [ROY_GM_MGT]) as 'REP_LINE/Mgment Proposal/tableRepLineRoy/GM',
	sum(distinct [VAR%_ROY_QTY_MGT]) as 'REP_LINE/Mgment Proposal/tableRepLineRoy/VAR',
	sum(distinct [ROY_QTY_PM]) as 'REP_LINE/PM Proposal/tableRepLineRoy/QTY',
	sum(distinct [ROY_GM%_PM]) as 'REP_LINE/PM Proposal/tableRepLineRoy/GMPERC',
	sum(distinct [ROY_INV_PM]) as 'REP_LINE/PM Proposal/tableRepLineRoy/INV',
	sum(distinct [ROY_GM_PM]) as 'REP_LINE/PM Proposal/tableRepLineRoy/GM',
	sum(distinct [FCS_QTY]) as 'REP_LINE/FCS/tableRepLineBDG/QTY',
	sum(distinct [FCS_GM%]) as 'REP_LINE/FCS/tableRepLineBDG/GMPERC',
	sum(distinct [FCS_INV]) as 'REP_LINE/FCS/tableRepLineBDG/INV',
	sum(distinct [FCS_GM]) as 'REP_LINE/FCS/tableRepLineBDG/GM',
	sum(distinct [VAR%_FCS_QTY]) as 'REP_LINE/FCS/tableRepLineBDG/VAR',
	sum(distinct [BDG_QTY_MGT]) as 'REP_LINE/Mgment Proposal/tableRepLineBDG/QTY',
	sum(distinct [BDG_GM%_MGT]) as 'REP_LINE/Mgment Proposal/tableRepLineBDG/GMPERC',
	sum(distinct [BDG_INV_MGT]) as 'REP_LINE/Mgment Proposal/tableRepLineBDG/INV',
	sum(distinct [BDG_GM_MGT]) as 'REP_LINE/Mgment Proposal/tableRepLineBDG/GM',
	sum(distinct [VAR%_BDG_QTY_MGT]) as 'REP_LINE/Mgment Proposal/tableRepLineBDG/VAR',
	sum(distinct [BDG_QTY_PM]) as 'REP_LINE/PM Proposal/tableRepLineBDG/QTY',
	sum(distinct [BDG_GM%_PM]) as 'REP_LINE/PM Proposal/tableRepLineBDG/GMPERC',
	sum(distinct [BDG_INV_PM]) as 'REP_LINE/PM Proposal/tableRepLineBDG/INV',
	sum(distinct [BDG_GM_PM]) as 'REP_LINE/PM Proposal/tableRepLineBDG/GM'
from
	Pm_Process pp
INNER JOIN Principals p on
	pp.PRINCIPAL_ERP_NUMBER = p.Principal_ERP_Number
INNER JOIN Countries c on
	p.COU_Company = c.COU_Company
	and pp.COMPANY = c.COU_Company
INNER JOIN UsersBudgetTool ubt on
	pp.PMNAME = ubt.UBT_Id
INNER JOIN BU b on
	b.BU_ID = ubt.BU_Id
	and b.COU_Id = c.COU_Id
WHERE
	c.COU_Id = @COU_Id
	and p.BU_Agrupada = @BU_Agrupada
	and ubt.UBT_TipoUserId = 'PM'
	AND p.PRINCIPAL_ERP_NUMBER = @PRINCIPAL_ERP_NUMBER
	and pp.PRINCIPAL_REPORTING_LINE = @PRINCIPAL_REPORTING_LINE
	and ubt.UBT_LocalADUuser in (
			select
		distinct ubt.UBT_LocalADUuser
	from
		UsersBudgetTool ubt
	where
		ubt.BU_Id in (
		select
			BU_Id
		from
			UsersBudgetTool ubt
		where
	ubt.BU_Agrupada = @BU_Agrupada
	)
	and ubt.UBT_TipoUserId = 'PM'
	)
GROUP BY pp.PRINCIPAL_REPORTING_LINE;

END;

CREATE PROCEDURE [dbo].[PM_Principals_Repline_List_Consult] (
	@COU_Id nvarchar(255),
	@BU_Agrupada nvarchar(255),
	@UBT_LocalADUuser nvarchar(255),
	@PRINCIPAL_ERP_NUMBER nvarchar(255),
	@CHECKED int,
	@ROL nvarchar(255)
) AS
BEGIN

SET NOCOUNT ON

if (@ROL = 'PM')
select
	distinct pp.PRINCIPAL_REPORTING_LINE as name
from
	Pm_Process pp
INNER JOIN Principals p on
	pp.PRINCIPAL_ERP_NUMBER = p.Principal_ERP_Number
INNER JOIN Countries c on
	p.COU_Company = c.COU_Company
	and pp.COMPANY = c.COU_Company
INNER JOIN UsersBudgetTool ubt on
	pp.PMNAME = ubt.UBT_Id
INNER JOIN BU b on b.BU_ID = ubt.BU_Id and b.COU_Id = c.COU_Id and p.BU_Agrupada = b.BU_Agrupada
WHERE
	c.COU_Id = @COU_Id
	and p.BU_Agrupada = @BU_Agrupada
	and ubt.UBT_LocalADUuser = @UBT_LocalADUuser
	and ubt.UBT_TipoUserId = 'PM'
	AND p.PRINCIPAL_ERP_NUMBER = @PRINCIPAL_ERP_NUMBER
	and pp.checked = @CHECKED

ELSE

SELECT
	distinct pp.PRINCIPAL_REPORTING_LINE as name
from
	Pm_Process pp
INNER JOIN Principals p on
	pp.PRINCIPAL_ERP_NUMBER = p.Principal_ERP_Number
INNER JOIN Countries c on
	p.COU_Company = c.COU_Company
	and pp.COMPANY = c.COU_Company
INNER JOIN UsersBudgetTool ubt on
	pp.PMNAME = ubt.UBT_Id
INNER JOIN BU b on
	b.BU_ID = ubt.BU_Id
	and b.COU_Id = c.COU_Id
WHERE
	c.COU_Id = @COU_Id
	and p.BU_Agrupada = @BU_Agrupada
	and ubt.UBT_TipoUserId = 'PM'
	and pp.checked = @CHECKED
	AND p.PRINCIPAL_ERP_NUMBER = @PRINCIPAL_ERP_NUMBER
	and ubt.UBT_LocalADUuser in (
	select
		distinct ubt.UBT_LocalADUuser
	from
		UsersBudgetTool ubt
	where
		ubt.BU_Id in (
		select
			BU_Id
		from
			UsersBudgetTool ubt
		where
			ubt.BU_Agrupada = @BU_Agrupada
	)
		and ubt.UBT_TipoUserId = 'PM'
	)
	ORDER BY
	pp.PRINCIPAL_REPORTING_LINE
;

END;

CREATE PROCEDURE [dbo].[PM_Principals_Repline_Products_Lost_Consult] (
	@COU_Id nvarchar(255),
	@BU_Agrupada nvarchar(255),
	@UBT_LocalADUuser nvarchar(255),
	@PRINCIPAL_ERP_NUMBER nvarchar(255),
	@PRINCIPAL_REPORTING_LINE nvarchar(255),
	@LOST nvarchar(255),
	@ROL nvarchar(255)
) AS
BEGIN

SET
	NOCOUNT ON
	if(@ROL = 'PM')
		if(@LOST = 'FALSE')
			select  distinct prlp.PRODUCT_NAME
			from Pm_ReportingLineProducts prlp
			INNER JOIN Pm_Process pp on prlp.PRINCIPAL_REPORTING_LINE1 = pp.PRINCIPAL_REPORTING_LINE
			INNER JOIN Principals p on
				pp.PRINCIPAL_ERP_NUMBER = p.Principal_ERP_Number
			INNER JOIN Countries c on
				p.COU_Company = c.COU_Company
				and pp.COMPANY = c.COU_Company
				and prlp.COMPANY_COUNTRYCODE = c.COU_Acronim
			INNER JOIN UsersBudgetTool ubt on
				pp.PMNAME = ubt.UBT_Id and prlp.LOCAL_PRODUCTMANAGER_NAME = ubt.UBT_Id
			INNER JOIN BU b on
				b.BU_ID = ubt.BU_Id
				and b.COU_Id = c.COU_Id
				and p.BU_Agrupada = b.BU_Agrupada
			LEFT JOIN Pm_ProductLost ppl on prlp.PRODUCT_NAME = ppl.PRODUCT_NAME
			WHERE
				c.COU_Id = @COU_Id
				and p.BU_Agrupada = @BU_Agrupada
				and ubt.UBT_LocalADUuser = @UBT_LocalADUuser
				and ubt.UBT_TipoUserId = 'PM'
				AND p.PRINCIPAL_ERP_NUMBER = @PRINCIPAL_ERP_NUMBER
				and pp.PRINCIPAL_REPORTING_LINE = @PRINCIPAL_REPORTING_LINE
				and ppl.PRODUCT_NAME is null;
		else
			select distinct prlp.PRODUCT_NAME, ppl.LOST_MONTH as 'MONTH'
			from Pm_ReportingLineProducts prlp
			INNER JOIN Pm_Process pp on prlp.PRINCIPAL_REPORTING_LINE1 = pp.PRINCIPAL_REPORTING_LINE
			INNER JOIN Principals p on
				pp.PRINCIPAL_ERP_NUMBER = p.Principal_ERP_Number
			INNER JOIN Countries c on
				p.COU_Company = c.COU_Company
				and pp.COMPANY = c.COU_Company
				and prlp.COMPANY_COUNTRYCODE = c.COU_Acronim
			INNER JOIN UsersBudgetTool ubt on
				pp.PMNAME = ubt.UBT_Id and prlp.LOCAL_PRODUCTMANAGER_NAME = ubt.UBT_Id
			INNER JOIN BU b on
				b.BU_ID = ubt.BU_Id
				and b.COU_Id = c.COU_Id
				and p.BU_Agrupada = b.BU_Agrupada
			INNER JOIN Pm_ProductLost ppl on prlp.PRODUCT_NAME = ppl.PRODUCT_NAME
			WHERE
				c.COU_Id = @COU_Id
				and p.BU_Agrupada = @BU_Agrupada
				and ubt.UBT_LocalADUuser = @UBT_LocalADUuser
				and ubt.UBT_TipoUserId = 'PM'
				AND p.PRINCIPAL_ERP_NUMBER = @PRINCIPAL_ERP_NUMBER
				and pp.PRINCIPAL_REPORTING_LINE = @PRINCIPAL_REPORTING_LINE;
END;

CREATE PROCEDURE [dbo].[PM_Principals_Repline_Products_Lost_Delete] (
	@COU_Id nvarchar(255),
	@BU_Agrupada nvarchar(255),
	@UBT_LocalADUuser nvarchar(255),
	@PRINCIPAL_ERP_NUMBER nvarchar(255),
	@PRINCIPAL_REPORTING_LINE nvarchar(255)
) AS
BEGIN

SET
	NOCOUNT ON
	delete ppl
	from Pm_ReportingLineProducts prlp
				INNER JOIN Pm_Process pp on prlp.PRINCIPAL_REPORTING_LINE1 = pp.PRINCIPAL_REPORTING_LINE
				INNER JOIN Principals p on
					pp.PRINCIPAL_ERP_NUMBER = p.Principal_ERP_Number
				INNER JOIN Countries c on
					p.COU_Company = c.COU_Company
					and pp.COMPANY = c.COU_Company
					and prlp.COMPANY_COUNTRYCODE = c.COU_Acronim
				INNER JOIN UsersBudgetTool ubt on
					pp.PMNAME = ubt.UBT_Id and prlp.LOCAL_PRODUCTMANAGER_NAME = ubt.UBT_Id
				INNER JOIN BU b on
					b.BU_ID = ubt.BU_Id
					and b.COU_Id = c.COU_Id
					and p.BU_Agrupada = b.BU_Agrupada
				INNER JOIN Pm_ProductLost ppl on prlp.PRODUCT_NAME = ppl.PRODUCT_NAME
				WHERE
					c.COU_Id = @COU_Id
					and p.BU_Agrupada = @BU_Agrupada
					and ubt.UBT_LocalADUuser = @UBT_LocalADUuser
					and ubt.UBT_TipoUserId = 'PM'
					AND p.PRINCIPAL_ERP_NUMBER = @PRINCIPAL_ERP_NUMBER
					and pp.PRINCIPAL_REPORTING_LINE = @PRINCIPAL_REPORTING_LINE;
END;

CREATE PROCEDURE [dbo].[PM_Principals_Repline_Products_Lost_Insert] (
	@COU_Id nvarchar(255),
	@BU_Agrupada nvarchar(255),
	@UBT_LocalADUuser nvarchar(255),
	@PRINCIPAL_ERP_NUMBER nvarchar(255),
	@PRINCIPAL_REPORTING_LINE nvarchar(255),
	@PRODUCT_NAME nvarchar(255),
	@MONTH nvarchar(255),
	@COMMENTS nvarchar(255)
) AS BEGIN
SET
	NOCOUNT ON
	DECLARE @PMNAME nvarchar(255)
	DECLARE @COMPANY_COU nvarchar(255)
	DECLARE @COMPANY_ACRONIM nvarchar(255)

	select
		@PMNAME = ubt.UBT_Id,
		@COMPANY_COU = c.COU_COMPANY,
		@COMPANY_ACRONIM = c.COU_Acronim
	from
		Pm_Process pp
		INNER JOIN UsersBudgetTool ubt on pp.PMNAME = ubt.UBT_Id
		INNER JOIN BU b on ubt.BU_Id = b.BU_Id
		and ubt.BU_Agrupada = b.BU_Agrupada
		INNER JOIN Countries c on b.COU_Id = c.COU_Id
		and pp.COMPANY = c.COU_Company
	WHERE
		c.COU_Id = @COU_Id
		and b.BU_Agrupada = @BU_AGRUPADA
		and ubt.UBT_LocalADUuser = @UBT_LocalADUuser
		and ubt.UBT_TipoUserId = 'PM'
		AND pp.PRINCIPAL_ERP_NUMBER = @PRINCIPAL_ERP_NUMBER
		and pp.PRINCIPAL_REPORTING_LINE = @PRINCIPAL_REPORTING_LINE;

	IF(@PRODUCT_NAME = '')
	BEGIN


		UPDATE
			BUDGETTOOL.dbo.Pm_Process
		SET
			[MONTH_LOST] = @MONTH,
			[COMMENTS] = @COMMENTS
		WHERE
			COMPANY = @COMPANY_COU
			and PRINCIPAL_ERP_NUMBER = @PRINCIPAL_ERP_NUMBER
			and PRINCIPAL_REPORTING_LINE = @PRINCIPAL_REPORTING_LINE
			and PMNAME = @PMNAME;


		INSERT INTO
			BUDGETTOOL.dbo.Pm_ProductLost (
				COMPANY,
				PMNUMBER,
				PMNAME,
				PRINCIPAL_ERP_NUMBER,
				PRINCIPAL_NAME,
				PRINCIPAL_REPORTING_LINE,
				LOCAL_PRODUCTMANAGER_NAME,
				LOST_MONTH,
				COMMENTS,
				PRODUCT_NAME
			)
		select
			prlp.COMPANY_COUNTRYCODE,
			ubt.UBT_IdBuyer,
			ubt.UBT_LocalADUuser,
			p.Principal_ERP_Number,
			p.PrincipalName,
			pp.PRINCIPAL_REPORTING_LINE,
			prlp.LOCAL_PRODUCTMANAGER_NAME,
			@MONTH,
			@COMMENTS,
			prlp.PRODUCT_NAME
		from
			Pm_ReportingLineProducts prlp
			INNER JOIN Pm_Process pp on prlp.PRINCIPAL_REPORTING_LINE1 = pp.PRINCIPAL_REPORTING_LINE
			INNER JOIN Principals p on pp.PRINCIPAL_ERP_NUMBER = p.Principal_ERP_Number
			INNER JOIN Countries c on p.COU_Company = c.COU_Company
			and pp.COMPANY = c.COU_Company
			and prlp.COMPANY_COUNTRYCODE = c.COU_Acronim
			INNER JOIN UsersBudgetTool ubt on pp.PMNAME = ubt.UBT_Id
			and prlp.LOCAL_PRODUCTMANAGER_NAME = ubt.UBT_Id
			INNER JOIN BU b on b.BU_ID = ubt.BU_Id
			and b.COU_Id = c.COU_Id
			and p.BU_Agrupada = b.BU_Agrupada
		WHERE
			c.COU_Id = @COU_Id
			and p.BU_Agrupada = @BU_Agrupada
			and ubt.UBT_LocalADUuser = @UBT_LocalADUuser
			and ubt.UBT_TipoUserId = 'PM'
			AND p.PRINCIPAL_ERP_NUMBER = @PRINCIPAL_ERP_NUMBER
			and pp.PRINCIPAL_REPORTING_LINE = @PRINCIPAL_REPORTING_LINE;
		END;
	ELSE
		BEGIN

		UPDATE
			BUDGETTOOL.dbo.Pm_Process
		SET
			[MONTH_LOST] = '',
			[COMMENTS] = ''
		WHERE
			COMPANY = @COMPANY_COU
			and PRINCIPAL_ERP_NUMBER = @PRINCIPAL_ERP_NUMBER
			and PRINCIPAL_REPORTING_LINE = @PRINCIPAL_REPORTING_LINE
			and PMNAME = @PMNAME;

		INSERT INTO
			BUDGETTOOL.dbo.Pm_ProductLost (
				COMPANY,
				PMNUMBER,
				PMNAME,
				PRINCIPAL_ERP_NUMBER,
				PRINCIPAL_NAME,
				PRINCIPAL_REPORTING_LINE,
				LOCAL_PRODUCTMANAGER_NAME,
				LOST_MONTH,
				COMMENTS,
				PRODUCT_NAME
			)
		select
			prlp.COMPANY_COUNTRYCODE,
			ubt.UBT_IdBuyer,
			ubt.UBT_LocalADUuser,
			p.Principal_ERP_Number,
			p.PrincipalName,
			pp.PRINCIPAL_REPORTING_LINE,
			prlp.LOCAL_PRODUCTMANAGER_NAME,
			@MONTH,
			@COMMENTS,
			prlp.PRODUCT_NAME
		from
			Pm_ReportingLineProducts prlp
			INNER JOIN Pm_Process pp on prlp.PRINCIPAL_REPORTING_LINE1 = pp.PRINCIPAL_REPORTING_LINE
			INNER JOIN Principals p on pp.PRINCIPAL_ERP_NUMBER = p.Principal_ERP_Number
			INNER JOIN Countries c on p.COU_Company = c.COU_Company
			and pp.COMPANY = c.COU_Company
			and prlp.COMPANY_COUNTRYCODE = c.COU_Acronim
			INNER JOIN UsersBudgetTool ubt on pp.PMNAME = ubt.UBT_Id
			and prlp.LOCAL_PRODUCTMANAGER_NAME = ubt.UBT_Id
			INNER JOIN BU b on b.BU_ID = ubt.BU_Id
			and b.COU_Id = c.COU_Id
			and p.BU_Agrupada = b.BU_Agrupada
		WHERE
			c.COU_Id = @COU_Id
			and p.BU_Agrupada = @BU_Agrupada
			and ubt.UBT_LocalADUuser = @UBT_LocalADUuser
			and ubt.UBT_TipoUserId = 'PM'
			AND p.PRINCIPAL_ERP_NUMBER = @PRINCIPAL_ERP_NUMBER
			and pp.PRINCIPAL_REPORTING_LINE = @PRINCIPAL_REPORTING_LINE
			and prlp.PRODUCT_NAME = @PRODUCT_NAME;
		END;
END;

CREATE PROCEDURE [dbo].[PM_process_Update] (
	@YTD_QTY float,
	@YTD_PERCGM float,
	@YTD_INV float,
	@YTD_GM float,
	@VAR_PERC_YTD_QTY float,
	@L12_QTY float,
	@L12_PERCGM float,
	@L12_INV float,
	@L12_GM float,
	@VARPERC_L12_QTY float,
	@Lyr_QTY float,
	@LYR_PERCGM float,
	@Lyr_INV float,
	@Lyr_GM float,
	@ROY_LYR_QTY float,
	@ROY_LYR_GM float,
    @ROY_LYR_GMPERC float,
	@ROY_LYR_INV float,
	@ROY_LYR_VARPERC_QTY float,
	@ROY_QTY_MGT float,
	@ROY_GMPERC_MGT float,
	@ROY_INV_MGT float,
	@ROY_GM_MGT float,
	@VARPERC_ROY_QTY_MGT float,
	@ROY_QTY_PM float,
	@ROY_GMPERC_PM float,
	@ROY_INV_PM float,
	@ROY_GM_PM float,
	@FCS_QTY float,
	@FCS_GM float,
    @FCS_GMPERC float,
	@FCS_INV float,
	@VARPERC_FCS_QTY float,
	@BDG_QTY_MGT float,
	@BDG_GMPERC_MGT float,
	@BDG_INV_MGT float,
	@BDG_GM_MGT float,
	@VARPERC_BDG_QTY_MGT float,
	@BDG_QTY_PM float,
	@BDG_GMPERC_PM float,
	@BDG_INV_PM float,
	@BDG_GM_PM float,
	@COMPANY nvarchar(255),
	@PRINCIPAL_ERP_NUMBER nvarchar(255),
	@PRINCIPAL_REPORTING_LINE nvarchar(255),
	@BU_AGRUPADA nvarchar(255),
	@UBT_LocalADUuser nvarchar(255)
) AS
BEGIN
	SET
	NOCOUNT ON
	DECLARE @PMNAME nvarchar(255)
	DECLARE @COMPANY_COU nvarchar(255)

select
	@PMNAME = ubt.UBT_Id, @COMPANY_COU = c.COU_COMPANY
from
	Pm_Process pp
INNER JOIN UsersBudgetTool ubt on
	pp.PMNAME = ubt.UBT_Id
INNER JOIN BU b on
	ubt.BU_Id = b.BU_Id
	and ubt.BU_Agrupada = b.BU_Agrupada
INNER JOIN Countries c on
	b.COU_Id = c.COU_Id
	and pp.COMPANY = c.COU_Company
WHERE
	c.COU_Id  = @COMPANY
	and b.BU_Agrupada = @BU_AGRUPADA
	and ubt.UBT_LocalADUuser = @UBT_LocalADUuser
	and ubt.UBT_TipoUserId = 'PM'
	AND pp.PRINCIPAL_ERP_NUMBER = @PRINCIPAL_ERP_NUMBER
	and pp.PRINCIPAL_REPORTING_LINE = @PRINCIPAL_REPORTING_LINE;

UPDATE
	BUDGETTOOL.dbo.Pm_Process

SET
	[YTD_QTY] = @YTD_QTY,
	[YTD_%GM] = @YTD_PERCGM,
	[YTD_INV] = @YTD_INV,
	[YTD_GM] = @YTD_GM,
	[VAR%_YTD_QTY] = @VAR_PERC_YTD_QTY,
	[L12_QTY] = @L12_QTY,
	[L12_ %GM] = @L12_PERCGM,
	[L12_INV] = @L12_INV,
	[L12_GM] = @L12_GM,
	[VAR%_L12_QTY] = @VARPERC_L12_QTY,
	[Lyr_QTY] = @Lyr_QTY,
	[LYR_ %GM] = @LYR_PERCGM,
	[Lyr_INV] = @Lyr_INV,
	[Lyr_GM] = @Lyr_GM,
	[ROY_LYR_QTY] = @ROY_LYR_QTY,
	[ROY_LYR_GM] = @ROY_LYR_GM,
    [ROY_LYR_GM%] = @ROY_LYR_GMPERC,
	[ROY_LYR_INV] = @ROY_LYR_INV,
	[ROY_LYR_VAR%_QTY] = @ROY_LYR_VARPERC_QTY,
	[ROY_QTY_MGT] = @ROY_QTY_MGT,
	[ROY_GM%_MGT] = @ROY_GMPERC_MGT,
	[ROY_INV_MGT] = @ROY_INV_MGT,
	[ROY_GM_MGT] = @ROY_GM_MGT,
	[VAR%_ROY_QTY_MGT] = @VARPERC_ROY_QTY_MGT,
	[ROY_QTY_PM] = @ROY_QTY_PM,
	[ROY_GM%_PM] = @ROY_GMPERC_PM,
	[ROY_INV_PM] = @ROY_INV_PM,
	[ROY_GM_PM] = @ROY_GM_PM,
	[FCS_QTY] = @FCS_QTY,
	[FCS_GM] = @FCS_GM,
    [FCS_GM%] = @FCS_GMPERC,
	[FCS_INV] = @FCS_INV,
	[VAR%_FCS_QTY] = @VARPERC_FCS_QTY,
	[BDG_QTY_MGT] = @BDG_QTY_MGT,
	[BDG_GM%_MGT] = @BDG_GMPERC_MGT,
	[BDG_INV_MGT] = @BDG_INV_MGT,
	[BDG_GM_MGT] = @BDG_GM_MGT,
	[VAR%_BDG_QTY_MGT] = @VARPERC_BDG_QTY_MGT,
	[BDG_QTY_PM] = @BDG_QTY_PM,
	[BDG_GM%_PM] = @BDG_GMPERC_PM,
	[BDG_INV_PM] = @BDG_INV_PM,
	[BDG_GM_PM] = @BDG_GM_PM,
	checked = 1
WHERE
	COMPANY = @COMPANY_COU
	and PRINCIPAL_ERP_NUMBER = @PRINCIPAL_ERP_NUMBER
	and PRINCIPAL_REPORTING_LINE = @PRINCIPAL_REPORTING_LINE
	and PMNAME = @PMNAME


	SELECT * FROM Pm_Process pp
	WHERE 	COMPANY = @COMPANY_COU
	and PRINCIPAL_ERP_NUMBER = @PRINCIPAL_ERP_NUMBER
	and PRINCIPAL_REPORTING_LINE = @PRINCIPAL_REPORTING_LINE
	and PMNAME = @PMNAME

END;

CREATE PROCEDURE [dbo].[PM_Reporting_Line_GroupedBy_Principal_Consult] (
	@COU_Id nvarchar(255),
	@BU_Agrupada nvarchar(255),
	@UBT_LocalADUuser nvarchar(255),
	@PRINCIPAL_ERP_NUMBER nvarchar(255),
	@ROL nvarchar(255)
) AS
BEGIN

SET
	NOCOUNT ON
	if (@ROL = 'PM')
select
	sum(distinct [YTD_QTY]) as 'PRINC/YTD/tablePrincipalHistData/QTY',
	sum(distinct [YTD_%GM]) as 'PRINC/YTD/tablePrincipalHistData/GMPERC',
	sum(distinct [YTD_INV]) as 'PRINC/YTD/tablePrincipalHistData/INV',
	sum(distinct [YTD_GM]) as 'PRINC/YTD/tablePrincipalHistData/GM',
	sum(distinct [VAR%_YTD_QTY]) as 'PRINC/YTD/tablePrincipalHistData/VAR',
	sum(distinct [L12_QTY]) as 'PRINC/L12/tablePrincipalHistData/QTY',
	sum(distinct [L12_ %GM]) as 'PRINC/L12/tablePrincipalHistData/GMPERC',
	sum(distinct [L12_INV]) as 'PRINC/L12/tablePrincipalHistData/INV',
	sum(distinct [L12_GM]) as 'PRINC/L12/tablePrincipalHistData/GM',
	sum(distinct [VAR%_L12_QTY]) as 'PRINC/L12/tablePrincipalHistData/VAR',
	sum(distinct [Lyr_QTY]) as 'PRINC/Lyr/tablePrincipalHistData/QTY',
	sum(distinct [LYR_ %GM]) as 'PRINC/Lyr/tablePrincipalHistData/GMPERC',
	sum(distinct [Lyr_INV]) as 'PRINC/Lyr/tablePrincipalHistData/INV',
	sum(distinct [Lyr_GM]) as 'PRINC/Lyr/tablePrincipalHistData/GM',
	sum(distinct [ROY_LYR_QTY]) as 'PRINC/ROY Lyr/tablePrincipalRoy/QTY',
	sum(distinct [ROY_LYR_GM%]) as 'PRINC/ROY Lyr/tablePrincipalRoy/GMPERC',
	sum(distinct [ROY_LYR_INV]) as 'PRINC/ROY Lyr/tablePrincipalRoy/INV',
	sum(distinct [ROY_LYR_GM]) as 'PRINC/ROY Lyr/tablePrincipalRoy/GM',
	sum(distinct [ROY_LYR_VAR%_QTY]) as 'PRINC/ROY Lyr/tablePrincipalRoy/VAR',
	sum(distinct [ROY_QTY_MGT]) as 'PRINC/Mgment Proposal/tablePrincipalRoy/QTY',
	sum(distinct [ROY_GM%_MGT]) as 'PRINC/Mgment Proposal/tablePrincipalRoy/GMPERC',
	sum(distinct [ROY_INV_MGT]) as 'PRINC/Mgment Proposal/tablePrincipalRoy/INV',
	sum(distinct [ROY_GM_MGT]) as 'PRINC/Mgment Proposal/tablePrincipalRoy/GM',
	sum(distinct [VAR%_ROY_QTY_MGT]) as 'PRINC/Mgment Proposal/tablePrincipalRoy/VAR',
	sum(distinct [ROY_QTY_PM]) as 'PRINC/PM Proposal/tablePrincipalRoy/QTY',
	sum(distinct [ROY_GM%_PM]) as 'PRINC/PM Proposal/tablePrincipalRoy/GMPERC',
	sum(distinct [ROY_INV_PM]) as 'PRINC/PM Proposal/tablePrincipalRoy/INV',
	sum(distinct [ROY_GM_PM]) as 'PRINC/PM Proposal/tablePrincipalRoy/GM',
	sum(distinct [FCS_QTY]) as 'PRINC/FCS/tablePrincipalBDG/QTY',
	sum(distinct [FCS_GM%]) as 'PRINC/FCS/tablePrincipalBDG/GMPERC',
	sum(distinct [FCS_INV]) as 'PRINC/FCS/tablePrincipalBDG/INV',
	sum(distinct [FCS_GM]) as 'PRINC/FCS/tablePrincipalBDG/GM',
	sum(distinct [VAR%_FCS_QTY]) as 'PRINC/FCS/tablePrincipalBDG/VAR',
	sum(distinct [BDG_QTY_MGT]) as 'PRINC/Mgment Proposal/tablePrincipalBDG/QTY',
	sum(distinct [BDG_GM%_MGT]) as 'PRINC/Mgment Proposal/tablePrincipalBDG/GMPERC',
	sum(distinct [BDG_INV_MGT]) as 'PRINC/Mgment Proposal/tablePrincipalBDG/INV',
	sum(distinct [BDG_GM_MGT]) as 'PRINC/Mgment Proposal/tablePrincipalBDG/GM',
	sum(distinct [VAR%_BDG_QTY_MGT]) as 'PRINC/Mgment Proposal/tablePrincipalBDG/VAR',
	sum(distinct [BDG_QTY_PM]) as 'PRINC/PM Proposal/tablePrincipalBDG/QTY',
	sum(distinct [BDG_GM%_PM]) as 'PRINC/PM Proposal/tablePrincipalBDG/GMPERC',
	sum(distinct [BDG_INV_PM]) as 'PRINC/PM Proposal/tablePrincipalBDG/INV',
	sum(distinct [BDG_GM_PM]) as 'PRINC/PM Proposal/tablePrincipalBDG/GM'
from
	Pm_Process pp
INNER JOIN Principals p on
	pp.PRINCIPAL_ERP_NUMBER = p.Principal_ERP_Number
INNER JOIN Countries c on
	p.COU_Company = c.COU_Company
	and pp.COMPANY = c.COU_Company
INNER JOIN UsersBudgetTool ubt on
	pp.PMNAME = ubt.UBT_Id
INNER JOIN BU b on
	b.BU_ID = ubt.BU_Id
	and b.COU_Id = c.COU_Id
WHERE
	c.COU_Id = @COU_Id
	and p.BU_Agrupada = @BU_Agrupada
	and ubt.UBT_LocalADUuser = @UBT_LocalADUuser
	and ubt.UBT_TipoUserId = 'PM'
	AND p.PRINCIPAL_ERP_NUMBER = @PRINCIPAL_ERP_NUMBER
GROUP BY p.PRINCIPAL_ERP_NUMBER;


ELSE

select
	sum(distinct [YTD_QTY]) as 'PRINC/YTD/tablePrincipalHistData/QTY',
	sum(distinct [YTD_%GM]) as 'PRINC/YTD/tablePrincipalHistData/GMPERC',
	sum(distinct [YTD_INV]) as 'PRINC/YTD/tablePrincipalHistData/INV',
	sum(distinct [YTD_GM]) as 'PRINC/YTD/tablePrincipalHistData/GM',
	sum(distinct [VAR%_YTD_QTY]) as 'PRINC/YTD/tablePrincipalHistData/VAR',
	sum(distinct [L12_QTY]) as 'PRINC/L12/tablePrincipalHistData/QTY',
	sum(distinct [L12_ %GM]) as 'PRINC/L12/tablePrincipalHistData/GMPERC',
	sum(distinct [L12_INV]) as 'PRINC/L12/tablePrincipalHistData/INV',
	sum(distinct [L12_GM]) as 'PRINC/L12/tablePrincipalHistData/GM',
	sum(distinct [VAR%_L12_QTY]) as 'PRINC/L12/tablePrincipalHistData/VAR',
	sum(distinct [Lyr_QTY]) as 'PRINC/Lyr/tablePrincipalHistData/QTY',
	sum(distinct [LYR_ %GM]) as 'PRINC/Lyr/tablePrincipalHistData/GMPERC',
	sum(distinct [Lyr_INV]) as 'PRINC/Lyr/tablePrincipalHistData/INV',
	sum(distinct [Lyr_GM]) as 'PRINC/Lyr/tablePrincipalHistData/GM',
	sum(distinct [ROY_LYR_QTY]) as 'PRINC/ROY Lyr/tablePrincipalRoy/QTY',
	sum(distinct [ROY_LYR_GM%]) as 'PRINC/ROY Lyr/tablePrincipalRoy/GMPERC',
	sum(distinct [ROY_LYR_INV]) as 'PRINC/ROY Lyr/tablePrincipalRoy/INV',
	sum(distinct [ROY_LYR_GM]) as 'PRINC/ROY Lyr/tablePrincipalRoy/GM',
	sum(distinct [ROY_LYR_VAR%_QTY]) as 'PRINC/ROY Lyr/tablePrincipalRoy/VAR',
	sum(distinct [ROY_QTY_MGT]) as 'PRINC/Mgment Proposal/tablePrincipalRoy/QTY',
	sum(distinct [ROY_GM%_MGT]) as 'PRINC/Mgment Proposal/tablePrincipalRoy/GMPERC',
	sum(distinct [ROY_INV_MGT]) as 'PRINC/Mgment Proposal/tablePrincipalRoy/INV',
	sum(distinct [ROY_GM_MGT]) as 'PRINC/Mgment Proposal/tablePrincipalRoy/GM',
	sum(distinct [VAR%_ROY_QTY_MGT]) as 'PRINC/Mgment Proposal/tablePrincipalRoy/VAR',
	sum(distinct [ROY_QTY_PM]) as 'PRINC/PM Proposal/tablePrincipalRoy/QTY',
	sum(distinct [ROY_GM%_PM]) as 'PRINC/PM Proposal/tablePrincipalRoy/GMPERC',
	sum(distinct [ROY_INV_PM]) as 'PRINC/PM Proposal/tablePrincipalRoy/INV',
	sum(distinct [ROY_GM_PM]) as 'PRINC/PM Proposal/tablePrincipalRoy/GM',
	sum(distinct [FCS_QTY]) as 'PRINC/FCS/tablePrincipalBDG/QTY',
	sum(distinct [FCS_GM%]) as 'PRINC/FCS/tablePrincipalBDG/GMPERC',
	sum(distinct [FCS_INV]) as 'PRINC/FCS/tablePrincipalBDG/INV',
	sum(distinct [FCS_GM]) as 'PRINC/FCS/tablePrincipalBDG/GM',
	sum(distinct [VAR%_FCS_QTY]) as 'PRINC/FCS/tablePrincipalBDG/VAR',
	sum(distinct [BDG_QTY_MGT]) as 'PRINC/Mgment Proposal/tablePrincipalBDG/QTY',
	sum(distinct [BDG_GM%_MGT]) as 'PRINC/Mgment Proposal/tablePrincipalBDG/GMPERC',
	sum(distinct [BDG_INV_MGT]) as 'PRINC/Mgment Proposal/tablePrincipalBDG/INV',
	sum(distinct [BDG_GM_MGT]) as 'PRINC/Mgment Proposal/tablePrincipalBDG/GM',
	sum(distinct [VAR%_BDG_QTY_MGT]) as 'PRINC/Mgment Proposal/tablePrincipalBDG/VAR',
	sum(distinct [BDG_QTY_PM]) as 'PRINC/PM Proposal/tablePrincipalBDG/QTY',
	sum(distinct [BDG_GM%_PM]) as 'PRINC/PM Proposal/tablePrincipalBDG/GMPERC',
	sum(distinct [BDG_INV_PM]) as 'PRINC/PM Proposal/tablePrincipalBDG/INV',
	sum(distinct [BDG_GM_PM]) as 'PRINC/PM Proposal/tablePrincipalBDG/GM'
from
	Pm_Process pp
INNER JOIN Principals p on
	pp.PRINCIPAL_ERP_NUMBER = p.Principal_ERP_Number
INNER JOIN Countries c on
	p.COU_Company = c.COU_Company
	and pp.COMPANY = c.COU_Company
INNER JOIN UsersBudgetTool ubt on
	pp.PMNAME = ubt.UBT_Id
INNER JOIN BU b on
	b.BU_ID = ubt.BU_Id
	and b.COU_Id = c.COU_Id
WHERE
	c.COU_Id = @COU_Id
	and p.BU_Agrupada = @BU_Agrupada
	and ubt.UBT_TipoUserId = 'PM'
	AND p.PRINCIPAL_ERP_NUMBER = @PRINCIPAL_ERP_NUMBER
	and ubt.UBT_LocalADUuser in (
			select
		distinct ubt.UBT_LocalADUuser
	from
		UsersBudgetTool ubt
	where
		ubt.BU_Id in (
		select
			BU_Id
		from
			UsersBudgetTool ubt
		where
	ubt.BU_Agrupada = @BU_Agrupada

	)
	and ubt.UBT_TipoUserId = 'PM'
	)
GROUP BY p.PRINCIPAL_ERP_NUMBER;


END;

CREATE PROCEDURE [dbo].[TradeName_Consult] (
	@principal nvarchar(255),
	@COU_Id nvarchar(255),
	@BU_AGRUPADA nvarchar(255)
) AS
BEGIN

SET NOCOUNT ON

select bbt.PRODUCT_TRADE_NAME  as name, bbt.PRODUCT_FULL_SEGMENT_NUMBER as id
from BUM_BUDGETPRODUCTS bbt
INNER JOIN Principals p on p.Principal_ERP_Number = bbt.PRINCIPAL_ERP_NUMBER
INNER JOIN Countries c on p.COU_Company = c.COU_Company
LEFT JOIN Bum_TradeName btn on bbt.PRODUCT_FULL_SEGMENT_NUMBER = btn.PRODUCT_FULL_SEGMENT_NUMBER and c.COU_Id = btn.COU_ID and btn.BUAGRUPADA = p.BU_Agrupada
WHERE p.Principal_ERP_Number = @principal and c.COU_Id = @COU_Id and p.BU_Agrupada = @BU_AGRUPADA and btn.PRODUCT_FULL_SEGMENT_NUMBER is null;


END;
