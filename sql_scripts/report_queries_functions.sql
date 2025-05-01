Create table leave_types(
	id serial,
	"leaveType" TEXT,
	CONSTRAINT "leave_types_pkey" PRIMARY KEY (id)
);

drop table leave_types;

insert into leave_types ("leaveType")
	Values ('casual'),('medical'),(
'specialCasual'),('extraordinary'),('earned'),('onDutyExam'),('onDutyOther'),('maternity'),('election'),('compensatory'),('withoutPay');

CREATE EXTENSION IF NOT EXISTS tablefunc;

CREATE OR REPLACE FUNCTION get_dynamic_leave_summary(
    p_user_id INT DEFAULT NULL,
    p_dept TEXT DEFAULT NULL,
    p_from DATE DEFAULT NULL,
    p_to DATE DEFAULT NULL,
    p_leave_type TEXT DEFAULT NULL,
    p_order_by TEXT DEFAULT 'user_id'  -- Can be 'user_id', 'name', 'dept'
)
RETURNS JSON AS $$
DECLARE
    col_defs TEXT;
    col_aliases TEXT;
    filter_sql TEXT := '';
    dyn_sql TEXT;
    result JSON;
BEGIN
    -- Step 1: Build dynamic columns from leave_types
    SELECT string_agg(format('"%s" INT', "leaveType"), ', ')
    INTO col_defs
    FROM (SELECT DISTINCT "leaveType" FROM leave_types ORDER BY "leaveType") AS t;

    SELECT string_agg(format('ct."%s"', "leaveType"), ', ')
    INTO col_aliases
    FROM (SELECT DISTINCT "leaveType" FROM leave_types ORDER BY "leaveType") AS t;

    -- Step 2: Build WHERE filter conditions as text
    IF p_user_id IS NOT NULL THEN
        filter_sql := filter_sql || format(' AND l.user_id = %s', p_user_id);
    END IF;
    IF p_dept IS NOT NULL THEN
        filter_sql := filter_sql || format(' AND u.dept = %L', p_dept);
    END IF;
    IF p_from IS NOT NULL THEN
        filter_sql := filter_sql || format(' AND l."fromDate" >= %L', p_from);
    END IF;
    IF p_to IS NOT NULL THEN
        filter_sql := filter_sql || format(' AND l."toDate" <= %L', p_to);
    END IF;
    IF p_leave_type IS NOT NULL THEN
        filter_sql := filter_sql || format(' AND l."leaveType" = %L', p_leave_type);
    END IF;

    -- Step 3: Build full dynamic SQL
    dyn_sql := format(
        $q$
        SELECT json_agg(row_to_json(ct3))
        FROM (
            SELECT u.user_id, u.name, u.dept, %s
            FROM (
                SELECT * FROM crosstab(
                    $ct$
                    SELECT l.user_id, l."leaveType", SUM(l."totalDays")
                    FROM public."LeaveApproved" l
                    JOIN public."User" u ON u.user_id = l.user_id
                    WHERE TRUE %s
                    GROUP BY l.user_id, l."leaveType"
                    ORDER BY l.user_id, l."leaveType"
                    $ct$,
                    'SELECT "leaveType" FROM leave_types ORDER BY "leaveType"'
                ) AS ct (user_id INT, %s)
            ) AS ct
            JOIN public."User" u ON u.user_id = ct.user_id
            ORDER BY %I
        ) AS ct3
        $q$,
        col_aliases, filter_sql, col_defs, p_order_by
    );

    -- Step 4: Execute the dynamic SQL
    EXECUTE dyn_sql INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql;



drop function get_dynamic_leave_summary();

BEGIN ;
SELECT get_dynamic_leave_summary();
select * from temp_leave_summary;
COMMIT;
