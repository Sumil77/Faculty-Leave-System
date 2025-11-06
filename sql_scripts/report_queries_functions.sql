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
    p_order_by TEXT DEFAULT 'user_id',  -- Can be 'user_id', 'name', 'dept'
    p_limit INT DEFAULT 20,
    p_offset INT DEFAULT 0
)
RETURNS JSON AS $$
DECLARE
    col_defs TEXT;
    col_aliases TEXT;
    filter_sql TEXT := '';
    dyn_sql TEXT;
    result JSON;
BEGIN
    -- Dynamic columns
    SELECT string_agg(format('"%s" INT', "leaveType"), ', ')
    INTO col_defs
    FROM (SELECT DISTINCT "leaveType" FROM leave_types ORDER BY "leaveType") AS t;

    SELECT string_agg(format('ct."%s"', "leaveType"), ', ')
    INTO col_aliases
    FROM (SELECT DISTINCT "leaveType" FROM leave_types ORDER BY "leaveType") AS t;

    -- Filters
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

    -- Dynamic SQL with LIMIT/OFFSET
    dyn_sql := format(
        $q$
        WITH all_rows AS (
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
        ),
        paged_rows AS (
            SELECT * FROM all_rows
            LIMIT %s OFFSET %s
        )
        SELECT json_build_object(
            'totalCount', (SELECT COUNT(*) FROM all_rows),
            'rows', COALESCE(json_agg(row_to_json(paged_rows)), '[]'::json)
        )
        FROM paged_rows
    $q$,
        col_aliases, filter_sql, col_defs, p_order_by, p_limit, p_offset
    );

    EXECUTE dyn_sql INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql;



CREATE OR REPLACE FUNCTION get_leave_history_json(
    p_user_ids INT[] DEFAULT NULL,
    p_dept TEXT DEFAULT NULL,
    p_from DATE DEFAULT NULL,
    p_to DATE DEFAULT NULL,
    p_leave_type TEXT DEFAULT NULL,
    p_order_by TEXT DEFAULT 'user_id',
    p_limit INT DEFAULT 20,
    p_offset INT DEFAULT 0
)
RETURNS JSON AS $$
DECLARE
    filter_sql TEXT := '';
    dyn_sql TEXT;
    result JSON;
BEGIN
    -- Filters
    IF p_user_ids IS NOT NULL THEN
        filter_sql := filter_sql || format(' AND l.user_id = ANY (p_user_ids)');
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

    -- Whitelist order_by
    IF p_order_by NOT IN ('user_id','name','desig','dept') THEN
        p_order_by := 'user_id';
    END IF;

    -- Dynamic SQL with CTE for total + pagination
    dyn_sql := format($q$
        WITH all_rows AS (
            SELECT 
                u.user_id,
                u.name,
                u.desig,
                u.dept,
                (
                    SELECT COALESCE(json_agg(row_to_json(leave_row)), '[]'::json)
                    FROM (
                        SELECT 
                            l."appliedOn",
                            l."fromDate",
                            l."toDate",
                            l."leaveType",
                            l."totalDays",
                            l."dept"
                        FROM public."LeaveApproved" l
                        WHERE l.user_id = u.user_id %s
                        ORDER BY l."fromDate"
                    ) AS leave_row
                ) AS leaves
            FROM public."User" u
            WHERE EXISTS (
                SELECT 1 FROM public."LeaveApproved" l
                WHERE l.user_id = u.user_id %s
            )
            ORDER BY %I
        ),
        paged_rows AS (
            SELECT * FROM all_rows
            LIMIT %s OFFSET %s
        )
        SELECT json_build_object(
            'totalCount', (SELECT COUNT(*) FROM all_rows),
            'rows', COALESCE(json_agg(row_to_json(paged_rows)), '[]'::json)
        )
        FROM paged_rows
    $q$, filter_sql, filter_sql, p_order_by, p_limit, p_offset);

    EXECUTE dyn_sql INTO result;
    RETURN result;
END;
$$ LANGUAGE plpgsql;




drop function get_dynamic_leave_summary();

BEGIN ;
SELECT get_dynamic_leave_summary();
select * from temp_leave_summary;
COMMIT;


CREATE OR REPLACE FUNCTION get_dynamic_leave_summary(
    p_user_id INT DEFAULT NULL,
    p_dept TEXT DEFAULT NULL,
    p_from DATE DEFAULT NULL,
    p_to DATE DEFAULT NULL,
    p_leave_type_id INT DEFAULT NULL,
    p_order_by TEXT DEFAULT 'user_id',  -- 'user_id', 'name', 'dept'
    p_limit INT DEFAULT 20,
    p_offset INT DEFAULT 0
)
RETURNS JSON AS $$
DECLARE
    col_defs TEXT;
    col_aliases TEXT;
    col_sum_expr TEXT;
    filter_sql TEXT := '';
    dyn_sql TEXT;
    result JSON;
BEGIN
    -- 1️⃣ Dynamic columns based on LeaveTypes acronym
    SELECT string_agg(format('"%s" NUMERIC(8,2)', acronym), ', ' ORDER BY id)
    INTO col_defs
    FROM public."LeaveTypes"
    WHERE active = true;

    IF col_defs IS NULL THEN
        RETURN json_build_object('totalCount', 0, 'rows', '[]'::json, 'analytics', '{}'::json);
    END IF;

    SELECT string_agg(format('ct."%s"', acronym), ', ' ORDER BY id)
    INTO col_aliases
    FROM public."LeaveTypes"
    WHERE active = true;

    SELECT string_agg(format('COALESCE(ct."%s",0)', acronym), ' + ')
    INTO col_sum_expr
    FROM public."LeaveTypes"
    WHERE active = true;

    -- 2️⃣ Apply filters
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
    IF p_leave_type_id IS NOT NULL THEN
        filter_sql := filter_sql || format(' AND l."leave_type_id" = %s', p_leave_type_id);
    END IF;

    -- 3️⃣ Build dynamic SQL
    dyn_sql := format($q$
        WITH all_rows AS (
            SELECT u.user_id, u.name, u.dept, %s, (%s)::NUMERIC(8,2) AS "Total"
            FROM (
                SELECT * FROM crosstab(
                    $ct$
                    SELECT l.user_id, lt.acronym, SUM(l."totalDays")::NUMERIC(8,2)
                    FROM public."LeaveApproved" l
                    JOIN public."User" u ON u.user_id = l.user_id
                    JOIN public."LeaveTypes" lt ON lt.id = l."leave_type_id"
                    WHERE TRUE %s
                    GROUP BY l.user_id, lt.acronym
                    ORDER BY l.user_id, lt.acronym
                    $ct$,
                    'SELECT acronym FROM public."LeaveTypes" WHERE active = true ORDER BY id'
                ) AS ct (user_id INT, %s)
            ) AS ct
            JOIN public."User" u ON u.user_id = ct.user_id
            ORDER BY %I
        ),
        paged_rows AS (
            SELECT * FROM all_rows
            LIMIT %s OFFSET %s
        ),
        analytics_raw AS (
            SELECT lt.acronym AS leave_type, SUM(l."totalDays")::NUMERIC(8,2) AS total
            FROM public."LeaveApproved" l
            JOIN public."LeaveTypes" lt ON lt.id = l."leave_type_id"
            JOIN public."User" u ON u.user_id = l.user_id
            WHERE TRUE %s
            GROUP BY lt.acronym
        ),
        analytics AS (
            SELECT jsonb_object_agg(leave_type, total) AS leaveTypeTotals,
                   SUM(total)::NUMERIC(8,2) AS grandTotal
            FROM analytics_raw
        )
        SELECT json_build_object(
            'totalCount', (SELECT COUNT(*) FROM all_rows),
            'rows', COALESCE(json_agg(row_to_json(paged_rows)), '[]'::json),
            'analytics', (SELECT row_to_json(analytics) FROM analytics)
        )
        FROM paged_rows
    $q$, col_aliases, col_sum_expr, filter_sql, col_defs, p_order_by, p_limit, p_offset, filter_sql);

    EXECUTE dyn_sql INTO result;
    RETURN result;
END;
$$ LANGUAGE plpgsql;




CREATE OR REPLACE FUNCTION get_leave_history_json(
    p_user_ids INT[] DEFAULT NULL,
    p_dept TEXT DEFAULT NULL,
    p_from DATE DEFAULT NULL,
    p_to DATE DEFAULT NULL,
    p_leave_type_id INT DEFAULT NULL,
    p_order_by TEXT DEFAULT 'user_id',
    p_limit INT DEFAULT 20,
    p_offset INT DEFAULT 0
)
RETURNS JSON AS $$
DECLARE
    filter_sql TEXT := '';
    dyn_sql TEXT;
    result JSON;
BEGIN
    -- Filters
    IF p_user_ids IS NOT NULL THEN
        filter_sql := filter_sql || format(' AND l.user_id = ANY (%L::int[])', array_to_string(p_user_ids, ','));
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
    IF p_leave_type_id IS NOT NULL THEN
        filter_sql := filter_sql || format(' AND l."leave_type_id" = %s', p_leave_type_id);
    END IF;

    -- Whitelist order_by
    IF p_order_by NOT IN ('user_id','name','desig','dept') THEN
        p_order_by := 'user_id';
    END IF;

    -- Dynamic SQL
    dyn_sql := format($q$
        WITH all_rows AS (
            SELECT u.user_id, u.name, u.desig, u.dept,
                (
                    SELECT COALESCE(json_agg(row_to_json(leave_row)), '[]'::json)
                    FROM (
                        SELECT l."appliedOn",
                               l."fromDate",
                               l."toDate",
                               lt.name AS "leaveType",
                               l."totalDays"::NUMERIC(8,2) AS "totalDays",
                               l."dept"
                        FROM public."LeaveApproved" l
                        JOIN public."LeaveTypes" lt ON lt.id = l."leave_type_id"
                        WHERE l.user_id = u.user_id %s
                        ORDER BY l."fromDate"
                    ) AS leave_row
                ) AS leaves
            FROM public."User" u
            WHERE EXISTS (
                SELECT 1 FROM public."LeaveApproved" l
                WHERE l.user_id = u.user_id %s
            )
            ORDER BY %I
        ),
        paged_rows AS (
            SELECT * FROM all_rows
            LIMIT %s OFFSET %s
        )
        SELECT json_build_object(
            'totalCount', (SELECT COUNT(*) FROM all_rows),
            'rows', COALESCE(json_agg(row_to_json(paged_rows)), '[]'::json)
        )
        FROM paged_rows;
    $q$, filter_sql, filter_sql, p_order_by, p_limit, p_offset);

    EXECUTE dyn_sql INTO result;
    RETURN result;
END;
$$ LANGUAGE plpgsql;


select get_leave_history_json();