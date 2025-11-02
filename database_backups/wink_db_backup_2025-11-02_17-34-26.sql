--
-- PostgreSQL database dump
--

-- Dumped from database version 14.1
-- Dumped by pg_dump version 17.4

-- Started on 2025-11-02 17:34:26

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--DROP DATABASE IF EXISTS wink_performance_review;
--
-- TOC entry 3945 (class 1262 OID 23626727)
-- Name: wink_performance_review; Type: DATABASE; Schema: -; Owner: postgres
--

--CREATE DATABASE wink_performance_review WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'Russian_Russia.1251';


ALTER DATABASE wink_performance_review OWNER TO postgres;

--\connect wink_performance_review

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 3946 (class 0 OID 0)
-- Dependencies: 3945
-- Name: DATABASE wink_performance_review; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON DATABASE wink_performance_review IS 'База данных для системы оценки эффективности сотрудников WINK';


--
-- TOC entry 4 (class 2615 OID 2200)
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 280 (class 1259 OID 23627757)
-- Name: company_triggers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.company_triggers (
    id integer NOT NULL,
    word character varying(255) NOT NULL,
    recommendation text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.company_triggers OWNER TO postgres;

--
-- TOC entry 279 (class 1259 OID 23627756)
-- Name: company_triggers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.company_triggers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.company_triggers_id_seq OWNER TO postgres;

--
-- TOC entry 3948 (class 0 OID 0)
-- Dependencies: 279
-- Name: company_triggers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.company_triggers_id_seq OWNED BY public.company_triggers.id;


--
-- TOC entry 226 (class 1259 OID 23626922)
-- Name: employee_goals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_goals (
    id integer NOT NULL,
    user_id integer NOT NULL,
    cycle_id integer NOT NULL,
    goal_number integer,
    title character varying(255) NOT NULL,
    description text,
    expected_deadline date,
    expected_results text,
    key_tasks text,
    status character varying(20) DEFAULT 'draft'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    rejection_comment text,
    period_id integer,
    CONSTRAINT employee_goals_goal_number_check CHECK (((goal_number >= 1) AND (goal_number <= 5))),
    CONSTRAINT employee_goals_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'submitted'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])))
);


ALTER TABLE public.employee_goals OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 23626921)
-- Name: employee_goals_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employee_goals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employee_goals_id_seq OWNER TO postgres;

--
-- TOC entry 3949 (class 0 OID 0)
-- Dependencies: 225
-- Name: employee_goals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employee_goals_id_seq OWNED BY public.employee_goals.id;


--
-- TOC entry 274 (class 1259 OID 23627639)
-- Name: employee_recommendations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_recommendations (
    id integer NOT NULL,
    employee_id integer,
    hr_id integer,
    achievements text,
    improvements text,
    development_plan text,
    sent_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    period_id integer
);


ALTER TABLE public.employee_recommendations OWNER TO postgres;

--
-- TOC entry 273 (class 1259 OID 23627638)
-- Name: employee_recommendations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employee_recommendations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employee_recommendations_id_seq OWNER TO postgres;

--
-- TOC entry 3950 (class 0 OID 0)
-- Dependencies: 273
-- Name: employee_recommendations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employee_recommendations_id_seq OWNED BY public.employee_recommendations.id;


--
-- TOC entry 268 (class 1259 OID 23627540)
-- Name: employee_review_periods; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_review_periods (
    id integer NOT NULL,
    user_id integer NOT NULL,
    name character varying(255) NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(50) DEFAULT 'not_started'::character varying,
    manager_approved boolean DEFAULT false,
    manager_approved_at timestamp without time zone,
    manager_approved_by integer,
    hr_approved boolean DEFAULT false,
    hr_approved_at timestamp without time zone,
    hr_approved_by integer,
    self_assessment_completed boolean DEFAULT false,
    self_assessment_completed_at timestamp without time zone,
    peer_reviews_count integer DEFAULT 0,
    manager_evaluation_completed boolean DEFAULT false,
    manager_evaluation_completed_at timestamp without time zone,
    requested_early_at timestamp without time zone,
    manager_goals_evaluation_completed boolean DEFAULT false,
    manager_goals_evaluation_completed_at timestamp without time zone,
    peer_reviews_completed boolean DEFAULT false,
    cycle_id integer,
    potential_assessment_completed boolean DEFAULT false,
    calculated_at timestamp without time zone
);


ALTER TABLE public.employee_review_periods OWNER TO postgres;

--
-- TOC entry 267 (class 1259 OID 23627539)
-- Name: employee_review_periods_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employee_review_periods_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employee_review_periods_id_seq OWNER TO postgres;

--
-- TOC entry 3951 (class 0 OID 0)
-- Dependencies: 267
-- Name: employee_review_periods_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employee_review_periods_id_seq OWNED BY public.employee_review_periods.id;


--
-- TOC entry 278 (class 1259 OID 23627731)
-- Name: employee_summaries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_summaries (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    cycle_id integer,
    summary_text text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.employee_summaries OWNER TO postgres;

--
-- TOC entry 277 (class 1259 OID 23627730)
-- Name: employee_summaries_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employee_summaries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employee_summaries_id_seq OWNER TO postgres;

--
-- TOC entry 3952 (class 0 OID 0)
-- Dependencies: 277
-- Name: employee_summaries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employee_summaries_id_seq OWNED BY public.employee_summaries.id;


--
-- TOC entry 222 (class 1259 OID 23626860)
-- Name: employee_tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_tasks (
    id integer NOT NULL,
    user_id integer NOT NULL,
    task_id integer NOT NULL,
    cycle_id integer NOT NULL,
    task_order integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT employee_tasks_task_order_check CHECK (((task_order >= 1) AND (task_order <= 3)))
);


ALTER TABLE public.employee_tasks OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 23626859)
-- Name: employee_tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employee_tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employee_tasks_id_seq OWNER TO postgres;

--
-- TOC entry 3953 (class 0 OID 0)
-- Dependencies: 221
-- Name: employee_tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employee_tasks_id_seq OWNED BY public.employee_tasks.id;


--
-- TOC entry 252 (class 1259 OID 23627253)
-- Name: final_reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.final_reviews (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    cycle_id integer NOT NULL,
    self_assessment_total integer,
    peer_review_total integer,
    manager_review_total integer,
    potential_total integer,
    total_score integer,
    rating integer,
    rating_category character varying(50),
    salary_increase_recommended boolean DEFAULT false,
    salary_increase_percent numeric(5,2),
    status character varying(20) DEFAULT 'draft'::character varying,
    final_feedback text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT final_reviews_rating_category_check CHECK (((rating_category)::text = ANY ((ARRAY['no_result'::character varying, 'low_result'::character varying, 'good_result'::character varying, 'outstanding'::character varying])::text[]))),
    CONSTRAINT final_reviews_rating_check CHECK (((rating >= 0) AND (rating <= 10))),
    CONSTRAINT final_reviews_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'completed'::character varying, 'calibrated'::character varying])::text[])))
);


ALTER TABLE public.final_reviews OWNER TO postgres;

--
-- TOC entry 251 (class 1259 OID 23627252)
-- Name: final_reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.final_reviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.final_reviews_id_seq OWNER TO postgres;

--
-- TOC entry 3954 (class 0 OID 0)
-- Dependencies: 251
-- Name: final_reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.final_reviews_id_seq OWNED BY public.final_reviews.id;


--
-- TOC entry 232 (class 1259 OID 23626986)
-- Name: form_sections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.form_sections (
    id integer NOT NULL,
    template_id integer NOT NULL,
    title character varying(255),
    description text,
    display_order integer,
    section_type character varying(30) DEFAULT 'instruction'::character varying,
    is_collapsible boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT form_sections_section_type_check CHECK (((section_type)::text = ANY ((ARRAY['instruction'::character varying, 'question_group'::character varying, 'calculation'::character varying, 'summary'::character varying])::text[])))
);


ALTER TABLE public.form_sections OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 23626985)
-- Name: form_sections_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.form_sections_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.form_sections_id_seq OWNER TO postgres;

--
-- TOC entry 3955 (class 0 OID 0)
-- Dependencies: 231
-- Name: form_sections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.form_sections_id_seq OWNED BY public.form_sections.id;


--
-- TOC entry 234 (class 1259 OID 23627004)
-- Name: form_static_blocks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.form_static_blocks (
    id integer NOT NULL,
    template_id integer NOT NULL,
    section_id integer,
    block_type character varying(30) NOT NULL,
    content text NOT NULL,
    display_order integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT form_static_blocks_block_type_check CHECK (((block_type)::text = ANY ((ARRAY['text'::character varying, 'list'::character varying, 'note'::character varying, 'warning'::character varying])::text[])))
);


ALTER TABLE public.form_static_blocks OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 23627003)
-- Name: form_static_blocks_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.form_static_blocks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.form_static_blocks_id_seq OWNER TO postgres;

--
-- TOC entry 3956 (class 0 OID 0)
-- Dependencies: 233
-- Name: form_static_blocks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.form_static_blocks_id_seq OWNED BY public.form_static_blocks.id;


--
-- TOC entry 230 (class 1259 OID 23626969)
-- Name: form_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.form_templates (
    id integer NOT NULL,
    code character varying(100) NOT NULL,
    title character varying(255) NOT NULL,
    audience character varying(30) NOT NULL,
    purpose text,
    applies_per character varying(20) DEFAULT 'task'::character varying,
    is_active boolean DEFAULT true,
    display_order integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT form_templates_applies_per_check CHECK (((applies_per)::text = ANY ((ARRAY['task'::character varying, 'cycle'::character varying, 'goal'::character varying])::text[]))),
    CONSTRAINT form_templates_audience_check CHECK (((audience)::text = ANY ((ARRAY['employee'::character varying, 'peer'::character varying, 'manager'::character varying, 'hr'::character varying, 'admin'::character varying])::text[])))
);


ALTER TABLE public.form_templates OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 23626968)
-- Name: form_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.form_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.form_templates_id_seq OWNER TO postgres;

--
-- TOC entry 3957 (class 0 OID 0)
-- Dependencies: 229
-- Name: form_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.form_templates_id_seq OWNED BY public.form_templates.id;


--
-- TOC entry 228 (class 1259 OID 23626950)
-- Name: goal_tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.goal_tasks (
    id integer NOT NULL,
    goal_id integer NOT NULL,
    task_number integer,
    task_description text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT goal_tasks_task_number_check CHECK (((task_number >= 1) AND (task_number <= 3)))
);


ALTER TABLE public.goal_tasks OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 23626949)
-- Name: goal_tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.goal_tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.goal_tasks_id_seq OWNER TO postgres;

--
-- TOC entry 3958 (class 0 OID 0)
-- Dependencies: 227
-- Name: goal_tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.goal_tasks_id_seq OWNED BY public.goal_tasks.id;


--
-- TOC entry 260 (class 1259 OID 23627425)
-- Name: manager_evaluations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.manager_evaluations (
    id integer NOT NULL,
    employee_id integer,
    manager_id integer,
    cycle_id integer,
    professional_qualities_score integer,
    personal_qualities_score integer,
    communication_with_colleagues boolean,
    employee_development_willingness boolean,
    considers_as_successor boolean,
    development_readiness character varying(50),
    turnover_risk_score integer,
    priorities_from_opz text,
    performance_total integer,
    potential_total integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    result_achievement_rating integer,
    personal_qualities_comment text,
    personal_contribution_comment text,
    interaction_quality_rating integer,
    improvement_suggestions text,
    overall_rating integer,
    feedback_summary text,
    goal_id integer,
    CONSTRAINT manager_evaluations_interaction_quality_rating_check CHECK (((interaction_quality_rating >= 0) AND (interaction_quality_rating <= 10))),
    CONSTRAINT manager_evaluations_overall_rating_check CHECK (((overall_rating >= 0) AND (overall_rating <= 10))),
    CONSTRAINT manager_evaluations_personal_qualities_score_check CHECK (((personal_qualities_score >= 1) AND (personal_qualities_score <= 4))),
    CONSTRAINT manager_evaluations_professional_qualities_score_check CHECK (((professional_qualities_score >= 1) AND (professional_qualities_score <= 5))),
    CONSTRAINT manager_evaluations_result_achievement_rating_check CHECK (((result_achievement_rating >= 0) AND (result_achievement_rating <= 10))),
    CONSTRAINT manager_evaluations_turnover_risk_score_check CHECK (((turnover_risk_score >= 0) AND (turnover_risk_score <= 10)))
);


ALTER TABLE public.manager_evaluations OWNER TO postgres;

--
-- TOC entry 259 (class 1259 OID 23627424)
-- Name: manager_evaluations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.manager_evaluations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.manager_evaluations_id_seq OWNER TO postgres;

--
-- TOC entry 3959 (class 0 OID 0)
-- Dependencies: 259
-- Name: manager_evaluations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.manager_evaluations_id_seq OWNED BY public.manager_evaluations.id;


--
-- TOC entry 272 (class 1259 OID 23627609)
-- Name: manager_recommendations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.manager_recommendations (
    id integer NOT NULL,
    employee_id integer,
    manager_id integer,
    hr_id integer,
    recommendations text NOT NULL,
    sent_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    period_id integer
);


ALTER TABLE public.manager_recommendations OWNER TO postgres;

--
-- TOC entry 271 (class 1259 OID 23627608)
-- Name: manager_recommendations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.manager_recommendations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.manager_recommendations_id_seq OWNER TO postgres;

--
-- TOC entry 3960 (class 0 OID 0)
-- Dependencies: 271
-- Name: manager_recommendations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.manager_recommendations_id_seq OWNED BY public.manager_recommendations.id;


--
-- TOC entry 244 (class 1259 OID 23627123)
-- Name: manager_review_questions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.manager_review_questions (
    id integer NOT NULL,
    question_text text NOT NULL,
    question_type character varying(50) NOT NULL,
    max_score integer,
    weight numeric(3,2) DEFAULT 1.0,
    is_active boolean DEFAULT true,
    display_order integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT manager_review_questions_question_type_check CHECK (((question_type)::text = ANY ((ARRAY['text'::character varying, 'scale_0_10'::character varying, 'multiple_choice'::character varying])::text[])))
);


ALTER TABLE public.manager_review_questions OWNER TO postgres;

--
-- TOC entry 243 (class 1259 OID 23627122)
-- Name: manager_review_questions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.manager_review_questions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.manager_review_questions_id_seq OWNER TO postgres;

--
-- TOC entry 3961 (class 0 OID 0)
-- Dependencies: 243
-- Name: manager_review_questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.manager_review_questions_id_seq OWNED BY public.manager_review_questions.id;


--
-- TOC entry 246 (class 1259 OID 23627136)
-- Name: manager_reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.manager_reviews (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    manager_id integer NOT NULL,
    task_id integer NOT NULL,
    cycle_id integer NOT NULL,
    question_id integer NOT NULL,
    answer_text text,
    answer_score integer,
    feedback_summary text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.manager_reviews OWNER TO postgres;

--
-- TOC entry 245 (class 1259 OID 23627135)
-- Name: manager_reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.manager_reviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.manager_reviews_id_seq OWNER TO postgres;

--
-- TOC entry 3962 (class 0 OID 0)
-- Dependencies: 245
-- Name: manager_reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.manager_reviews_id_seq OWNED BY public.manager_reviews.id;


--
-- TOC entry 264 (class 1259 OID 23627506)
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id integer NOT NULL,
    type character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    related_user_id integer,
    related_id integer,
    is_read boolean DEFAULT false,
    read_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- TOC entry 263 (class 1259 OID 23627505)
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO postgres;

--
-- TOC entry 3963 (class 0 OID 0)
-- Dependencies: 263
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- TOC entry 256 (class 1259 OID 23627322)
-- Name: peer_feedback_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.peer_feedback_requests (
    id integer NOT NULL,
    requester_id integer,
    reviewer_id integer,
    status character varying(20) DEFAULT 'pending'::character varying,
    message text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    completed_at timestamp without time zone,
    period_id integer NOT NULL
);


ALTER TABLE public.peer_feedback_requests OWNER TO postgres;

--
-- TOC entry 255 (class 1259 OID 23627321)
-- Name: peer_feedback_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.peer_feedback_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.peer_feedback_requests_id_seq OWNER TO postgres;

--
-- TOC entry 3964 (class 0 OID 0)
-- Dependencies: 255
-- Name: peer_feedback_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.peer_feedback_requests_id_seq OWNED BY public.peer_feedback_requests.id;


--
-- TOC entry 258 (class 1259 OID 23627350)
-- Name: peer_feedbacks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.peer_feedbacks (
    id integer NOT NULL,
    request_id integer,
    requester_id integer,
    reviewer_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    result_achievement_rating integer,
    personal_qualities_comment text,
    interaction_quality_rating integer,
    improvement_suggestions text,
    period_id integer NOT NULL,
    CONSTRAINT peer_feedbacks_interaction_quality_rating_check CHECK (((interaction_quality_rating >= 0) AND (interaction_quality_rating <= 10))),
    CONSTRAINT peer_feedbacks_result_achievement_rating_check CHECK (((result_achievement_rating >= 0) AND (result_achievement_rating <= 10)))
);


ALTER TABLE public.peer_feedbacks OWNER TO postgres;

--
-- TOC entry 257 (class 1259 OID 23627349)
-- Name: peer_feedbacks_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.peer_feedbacks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.peer_feedbacks_id_seq OWNER TO postgres;

--
-- TOC entry 3965 (class 0 OID 0)
-- Dependencies: 257
-- Name: peer_feedbacks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.peer_feedbacks_id_seq OWNED BY public.peer_feedbacks.id;


--
-- TOC entry 240 (class 1259 OID 23627071)
-- Name: peer_review_questions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.peer_review_questions (
    id integer NOT NULL,
    question_text text NOT NULL,
    question_type character varying(50) NOT NULL,
    max_score integer,
    weight numeric(3,2) DEFAULT 1.0,
    is_active boolean DEFAULT true,
    display_order integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT peer_review_questions_question_type_check CHECK (((question_type)::text = ANY ((ARRAY['text'::character varying, 'scale_0_10'::character varying, 'multiple_choice'::character varying])::text[])))
);


ALTER TABLE public.peer_review_questions OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 23627070)
-- Name: peer_review_questions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.peer_review_questions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.peer_review_questions_id_seq OWNER TO postgres;

--
-- TOC entry 3966 (class 0 OID 0)
-- Dependencies: 239
-- Name: peer_review_questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.peer_review_questions_id_seq OWNED BY public.peer_review_questions.id;


--
-- TOC entry 242 (class 1259 OID 23627084)
-- Name: peer_reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.peer_reviews (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    respondent_id integer NOT NULL,
    task_id integer NOT NULL,
    cycle_id integer NOT NULL,
    question_id integer NOT NULL,
    answer_text text,
    answer_score integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.peer_reviews OWNER TO postgres;

--
-- TOC entry 241 (class 1259 OID 23627083)
-- Name: peer_reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.peer_reviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.peer_reviews_id_seq OWNER TO postgres;

--
-- TOC entry 3967 (class 0 OID 0)
-- Dependencies: 241
-- Name: peer_reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.peer_reviews_id_seq OWNED BY public.peer_reviews.id;


--
-- TOC entry 270 (class 1259 OID 23627556)
-- Name: performance_review_status; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.performance_review_status (
    id integer NOT NULL,
    user_id integer NOT NULL,
    period_id integer NOT NULL,
    status character varying(50) DEFAULT 'not_started'::character varying NOT NULL,
    early_request_date timestamp without time zone,
    early_request_comment text,
    manager_approved_date timestamp without time zone,
    manager_approved_by integer,
    manager_approval_comment text,
    hr_approved_date timestamp without time zone,
    hr_approved_by integer,
    hr_approval_comment text,
    self_assessment_date timestamp without time zone,
    peer_feedback_completed_date timestamp without time zone,
    manager_evaluation_date timestamp without time zone,
    potential_assessment_date timestamp without time zone,
    completed_date timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.performance_review_status OWNER TO postgres;

--
-- TOC entry 269 (class 1259 OID 23627555)
-- Name: performance_review_status_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.performance_review_status_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.performance_review_status_id_seq OWNER TO postgres;

--
-- TOC entry 3968 (class 0 OID 0)
-- Dependencies: 269
-- Name: performance_review_status_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.performance_review_status_id_seq OWNED BY public.performance_review_status.id;


--
-- TOC entry 276 (class 1259 OID 23627689)
-- Name: potential_assessments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.potential_assessments (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    manager_id integer NOT NULL,
    cycle_id integer NOT NULL,
    prof_responsibility boolean DEFAULT false,
    prof_result_oriented boolean DEFAULT false,
    prof_proactivity boolean DEFAULT false,
    prof_open_mindset boolean DEFAULT false,
    prof_team_player boolean DEFAULT false,
    professional_comment text,
    pers_took_responsibility boolean DEFAULT false,
    pers_transparent_communication boolean DEFAULT false,
    pers_shared_info boolean DEFAULT false,
    pers_organized_work boolean DEFAULT false,
    personal_comment text,
    had_motivation_one_on_one boolean DEFAULT false,
    knows_miscommunication_cases boolean DEFAULT false,
    development_desire character varying(50),
    is_successor boolean DEFAULT false,
    successor_ready_timing character varying(50),
    turnover_risk integer,
    ole_priority_1 text,
    ole_priority_2 text,
    performance_raw_score integer,
    performance_final_score integer,
    potential_raw_score integer,
    potential_final_score integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.potential_assessments OWNER TO postgres;

--
-- TOC entry 275 (class 1259 OID 23627688)
-- Name: potential_assessments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.potential_assessments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.potential_assessments_id_seq OWNER TO postgres;

--
-- TOC entry 3969 (class 0 OID 0)
-- Dependencies: 275
-- Name: potential_assessments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.potential_assessments_id_seq OWNED BY public.potential_assessments.id;


--
-- TOC entry 250 (class 1259 OID 23627230)
-- Name: potential_detail_answers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.potential_detail_answers (
    id integer NOT NULL,
    assessment_id integer NOT NULL,
    question_id integer NOT NULL,
    answer_boolean boolean,
    answer_integer integer,
    answer_text text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.potential_detail_answers OWNER TO postgres;

--
-- TOC entry 249 (class 1259 OID 23627229)
-- Name: potential_detail_answers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.potential_detail_answers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.potential_detail_answers_id_seq OWNER TO postgres;

--
-- TOC entry 3970 (class 0 OID 0)
-- Dependencies: 249
-- Name: potential_detail_answers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.potential_detail_answers_id_seq OWNED BY public.potential_detail_answers.id;


--
-- TOC entry 248 (class 1259 OID 23627217)
-- Name: potential_detail_questions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.potential_detail_questions (
    id integer NOT NULL,
    question_number character varying(10) NOT NULL,
    question_text text NOT NULL,
    answer_type character varying(30) NOT NULL,
    weight numeric(3,2) DEFAULT 1.0,
    is_active boolean DEFAULT true,
    display_order integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT potential_detail_questions_answer_type_check CHECK (((answer_type)::text = ANY ((ARRAY['yes_no'::character varying, 'scale_0_10'::character varying, 'text'::character varying, 'timeframe'::character varying])::text[])))
);


ALTER TABLE public.potential_detail_questions OWNER TO postgres;

--
-- TOC entry 247 (class 1259 OID 23627216)
-- Name: potential_detail_questions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.potential_detail_questions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.potential_detail_questions_id_seq OWNER TO postgres;

--
-- TOC entry 3971 (class 0 OID 0)
-- Dependencies: 247
-- Name: potential_detail_questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.potential_detail_questions_id_seq OWNED BY public.potential_detail_questions.id;


--
-- TOC entry 254 (class 1259 OID 23627283)
-- Name: recommendation_triggers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.recommendation_triggers (
    id integer NOT NULL,
    trigger_word character varying(100) NOT NULL,
    recommendation_text text NOT NULL,
    category character varying(50),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.recommendation_triggers OWNER TO postgres;

--
-- TOC entry 253 (class 1259 OID 23627282)
-- Name: recommendation_triggers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.recommendation_triggers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.recommendation_triggers_id_seq OWNER TO postgres;

--
-- TOC entry 3972 (class 0 OID 0)
-- Dependencies: 253
-- Name: recommendation_triggers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.recommendation_triggers_id_seq OWNED BY public.recommendation_triggers.id;


--
-- TOC entry 212 (class 1259 OID 23626776)
-- Name: review_cycles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.review_cycles (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT review_cycles_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'active'::character varying, 'calibration'::character varying, 'completed'::character varying])::text[])))
);


ALTER TABLE public.review_cycles OWNER TO postgres;

--
-- TOC entry 211 (class 1259 OID 23626775)
-- Name: review_cycles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.review_cycles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.review_cycles_id_seq OWNER TO postgres;

--
-- TOC entry 3973 (class 0 OID 0)
-- Dependencies: 211
-- Name: review_cycles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.review_cycles_id_seq OWNED BY public.review_cycles.id;


--
-- TOC entry 266 (class 1259 OID 23627531)
-- Name: review_periods; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.review_periods (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    is_active boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.review_periods OWNER TO postgres;

--
-- TOC entry 265 (class 1259 OID 23627530)
-- Name: review_periods_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.review_periods_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.review_periods_id_seq OWNER TO postgres;

--
-- TOC entry 3974 (class 0 OID 0)
-- Dependencies: 265
-- Name: review_periods_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.review_periods_id_seq OWNED BY public.review_periods.id;


--
-- TOC entry 224 (class 1259 OID 23626888)
-- Name: selected_respondents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.selected_respondents (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    respondent_id integer NOT NULL,
    task_id integer NOT NULL,
    cycle_id integer NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT selected_respondents_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'completed'::character varying, 'declined'::character varying])::text[])))
);


ALTER TABLE public.selected_respondents OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 23626887)
-- Name: selected_respondents_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.selected_respondents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.selected_respondents_id_seq OWNER TO postgres;

--
-- TOC entry 3975 (class 0 OID 0)
-- Dependencies: 223
-- Name: selected_respondents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.selected_respondents_id_seq OWNED BY public.selected_respondents.id;


--
-- TOC entry 236 (class 1259 OID 23627025)
-- Name: self_assessment_questions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.self_assessment_questions (
    id integer NOT NULL,
    question_text text NOT NULL,
    question_type character varying(50) NOT NULL,
    options text,
    max_score integer,
    weight numeric(3,2) DEFAULT 1.0,
    is_active boolean DEFAULT true,
    display_order integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT self_assessment_questions_question_type_check CHECK (((question_type)::text = ANY ((ARRAY['text'::character varying, 'scale_0_10'::character varying, 'multiple_choice'::character varying])::text[])))
);


ALTER TABLE public.self_assessment_questions OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 23627024)
-- Name: self_assessment_questions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.self_assessment_questions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.self_assessment_questions_id_seq OWNER TO postgres;

--
-- TOC entry 3976 (class 0 OID 0)
-- Dependencies: 235
-- Name: self_assessment_questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.self_assessment_questions_id_seq OWNED BY public.self_assessment_questions.id;


--
-- TOC entry 238 (class 1259 OID 23627038)
-- Name: self_assessments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.self_assessments (
    id integer NOT NULL,
    user_id integer NOT NULL,
    task_id integer NOT NULL,
    cycle_id integer NOT NULL,
    question_id integer NOT NULL,
    answer_text text,
    answer_score integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.self_assessments OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 23627037)
-- Name: self_assessments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.self_assessments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.self_assessments_id_seq OWNER TO postgres;

--
-- TOC entry 3977 (class 0 OID 0)
-- Dependencies: 237
-- Name: self_assessments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.self_assessments_id_seq OWNED BY public.self_assessments.id;


--
-- TOC entry 220 (class 1259 OID 23626844)
-- Name: task_annotations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.task_annotations (
    id integer NOT NULL,
    task_id integer NOT NULL,
    annotation_text text NOT NULL,
    source_sheet character varying(100) DEFAULT 'Распределение задач'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.task_annotations OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 23626843)
-- Name: task_annotations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.task_annotations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.task_annotations_id_seq OWNER TO postgres;

--
-- TOC entry 3978 (class 0 OID 0)
-- Dependencies: 219
-- Name: task_annotations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.task_annotations_id_seq OWNED BY public.task_annotations.id;


--
-- TOC entry 216 (class 1259 OID 23626801)
-- Name: task_leads; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.task_leads (
    id integer NOT NULL,
    task_id integer NOT NULL,
    user_id integer,
    full_name character varying(255) NOT NULL,
    role_title character varying(100),
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.task_leads OWNER TO postgres;

--
-- TOC entry 215 (class 1259 OID 23626800)
-- Name: task_leads_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.task_leads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.task_leads_id_seq OWNER TO postgres;

--
-- TOC entry 3979 (class 0 OID 0)
-- Dependencies: 215
-- Name: task_leads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.task_leads_id_seq OWNED BY public.task_leads.id;


--
-- TOC entry 218 (class 1259 OID 23626823)
-- Name: task_participants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.task_participants (
    id integer NOT NULL,
    task_id integer NOT NULL,
    user_id integer,
    full_name character varying(255) NOT NULL,
    responsibility_area character varying(150),
    is_internal boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.task_participants OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 23626822)
-- Name: task_participants_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.task_participants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.task_participants_id_seq OWNER TO postgres;

--
-- TOC entry 3980 (class 0 OID 0)
-- Dependencies: 217
-- Name: task_participants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.task_participants_id_seq OWNED BY public.task_participants.id;


--
-- TOC entry 214 (class 1259 OID 23626786)
-- Name: tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tasks (
    id integer NOT NULL,
    legacy_number integer,
    name character varying(255) NOT NULL,
    description text,
    department character varying(100),
    owning_unit character varying(100),
    status character varying(20) DEFAULT 'active'::character varying,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tasks_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'archived'::character varying])::text[])))
);


ALTER TABLE public.tasks OWNER TO postgres;

--
-- TOC entry 213 (class 1259 OID 23626785)
-- Name: tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tasks_id_seq OWNER TO postgres;

--
-- TOC entry 3981 (class 0 OID 0)
-- Dependencies: 213
-- Name: tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tasks_id_seq OWNED BY public.tasks.id;


--
-- TOC entry 262 (class 1259 OID 23627477)
-- Name: user_review_periods; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_review_periods (
    id integer NOT NULL,
    user_id integer NOT NULL,
    cycle_id integer NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    notification_sent boolean DEFAULT false,
    reminder_sent boolean DEFAULT false,
    status character varying(20) DEFAULT 'pending'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT user_review_periods_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'overdue'::character varying])::text[])))
);


ALTER TABLE public.user_review_periods OWNER TO postgres;

--
-- TOC entry 261 (class 1259 OID 23627476)
-- Name: user_review_periods_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_review_periods_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_review_periods_id_seq OWNER TO postgres;

--
-- TOC entry 3982 (class 0 OID 0)
-- Dependencies: 261
-- Name: user_review_periods_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_review_periods_id_seq OWNED BY public.user_review_periods.id;


--
-- TOC entry 210 (class 1259 OID 23626753)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    role character varying(20) NOT NULL,
    department character varying(100),
    "position" character varying(100),
    manager_id integer,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    hire_date date,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['employee'::character varying, 'manager'::character varying, 'hr'::character varying, 'admin'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 209 (class 1259 OID 23626752)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- TOC entry 3983 (class 0 OID 0)
-- Dependencies: 209
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 3475 (class 2604 OID 23627760)
-- Name: company_triggers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_triggers ALTER COLUMN id SET DEFAULT nextval('public.company_triggers_id_seq'::regclass);


--
-- TOC entry 3363 (class 2604 OID 23626925)
-- Name: employee_goals id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_goals ALTER COLUMN id SET DEFAULT nextval('public.employee_goals_id_seq'::regclass);


--
-- TOC entry 3453 (class 2604 OID 23627642)
-- Name: employee_recommendations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_recommendations ALTER COLUMN id SET DEFAULT nextval('public.employee_recommendations_id_seq'::regclass);


--
-- TOC entry 3433 (class 2604 OID 23627543)
-- Name: employee_review_periods id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_review_periods ALTER COLUMN id SET DEFAULT nextval('public.employee_review_periods_id_seq'::regclass);


--
-- TOC entry 3472 (class 2604 OID 23627734)
-- Name: employee_summaries id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_summaries ALTER COLUMN id SET DEFAULT nextval('public.employee_summaries_id_seq'::regclass);


--
-- TOC entry 3358 (class 2604 OID 23626863)
-- Name: employee_tasks id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_tasks ALTER COLUMN id SET DEFAULT nextval('public.employee_tasks_id_seq'::regclass);


--
-- TOC entry 3404 (class 2604 OID 23627256)
-- Name: final_reviews id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.final_reviews ALTER COLUMN id SET DEFAULT nextval('public.final_reviews_id_seq'::regclass);


--
-- TOC entry 3374 (class 2604 OID 23626989)
-- Name: form_sections id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.form_sections ALTER COLUMN id SET DEFAULT nextval('public.form_sections_id_seq'::regclass);


--
-- TOC entry 3378 (class 2604 OID 23627007)
-- Name: form_static_blocks id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.form_static_blocks ALTER COLUMN id SET DEFAULT nextval('public.form_static_blocks_id_seq'::regclass);


--
-- TOC entry 3369 (class 2604 OID 23626972)
-- Name: form_templates id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.form_templates ALTER COLUMN id SET DEFAULT nextval('public.form_templates_id_seq'::regclass);


--
-- TOC entry 3367 (class 2604 OID 23626953)
-- Name: goal_tasks id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goal_tasks ALTER COLUMN id SET DEFAULT nextval('public.goal_tasks_id_seq'::regclass);


--
-- TOC entry 3418 (class 2604 OID 23627428)
-- Name: manager_evaluations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.manager_evaluations ALTER COLUMN id SET DEFAULT nextval('public.manager_evaluations_id_seq'::regclass);


--
-- TOC entry 3449 (class 2604 OID 23627612)
-- Name: manager_recommendations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.manager_recommendations ALTER COLUMN id SET DEFAULT nextval('public.manager_recommendations_id_seq'::regclass);


--
-- TOC entry 3392 (class 2604 OID 23627126)
-- Name: manager_review_questions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.manager_review_questions ALTER COLUMN id SET DEFAULT nextval('public.manager_review_questions_id_seq'::regclass);


--
-- TOC entry 3396 (class 2604 OID 23627139)
-- Name: manager_reviews id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.manager_reviews ALTER COLUMN id SET DEFAULT nextval('public.manager_reviews_id_seq'::regclass);


--
-- TOC entry 3427 (class 2604 OID 23627509)
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- TOC entry 3412 (class 2604 OID 23627325)
-- Name: peer_feedback_requests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.peer_feedback_requests ALTER COLUMN id SET DEFAULT nextval('public.peer_feedback_requests_id_seq'::regclass);


--
-- TOC entry 3415 (class 2604 OID 23627353)
-- Name: peer_feedbacks id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.peer_feedbacks ALTER COLUMN id SET DEFAULT nextval('public.peer_feedbacks_id_seq'::regclass);


--
-- TOC entry 3386 (class 2604 OID 23627074)
-- Name: peer_review_questions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.peer_review_questions ALTER COLUMN id SET DEFAULT nextval('public.peer_review_questions_id_seq'::regclass);


--
-- TOC entry 3390 (class 2604 OID 23627087)
-- Name: peer_reviews id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.peer_reviews ALTER COLUMN id SET DEFAULT nextval('public.peer_reviews_id_seq'::regclass);


--
-- TOC entry 3445 (class 2604 OID 23627559)
-- Name: performance_review_status id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.performance_review_status ALTER COLUMN id SET DEFAULT nextval('public.performance_review_status_id_seq'::regclass);


--
-- TOC entry 3457 (class 2604 OID 23627692)
-- Name: potential_assessments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.potential_assessments ALTER COLUMN id SET DEFAULT nextval('public.potential_assessments_id_seq'::regclass);


--
-- TOC entry 3402 (class 2604 OID 23627233)
-- Name: potential_detail_answers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.potential_detail_answers ALTER COLUMN id SET DEFAULT nextval('public.potential_detail_answers_id_seq'::regclass);


--
-- TOC entry 3398 (class 2604 OID 23627220)
-- Name: potential_detail_questions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.potential_detail_questions ALTER COLUMN id SET DEFAULT nextval('public.potential_detail_questions_id_seq'::regclass);


--
-- TOC entry 3409 (class 2604 OID 23627286)
-- Name: recommendation_triggers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recommendation_triggers ALTER COLUMN id SET DEFAULT nextval('public.recommendation_triggers_id_seq'::regclass);


--
-- TOC entry 3343 (class 2604 OID 23626779)
-- Name: review_cycles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review_cycles ALTER COLUMN id SET DEFAULT nextval('public.review_cycles_id_seq'::regclass);


--
-- TOC entry 3430 (class 2604 OID 23627534)
-- Name: review_periods id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review_periods ALTER COLUMN id SET DEFAULT nextval('public.review_periods_id_seq'::regclass);


--
-- TOC entry 3360 (class 2604 OID 23626891)
-- Name: selected_respondents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.selected_respondents ALTER COLUMN id SET DEFAULT nextval('public.selected_respondents_id_seq'::regclass);


--
-- TOC entry 3380 (class 2604 OID 23627028)
-- Name: self_assessment_questions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.self_assessment_questions ALTER COLUMN id SET DEFAULT nextval('public.self_assessment_questions_id_seq'::regclass);


--
-- TOC entry 3384 (class 2604 OID 23627041)
-- Name: self_assessments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.self_assessments ALTER COLUMN id SET DEFAULT nextval('public.self_assessments_id_seq'::regclass);


--
-- TOC entry 3355 (class 2604 OID 23626847)
-- Name: task_annotations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_annotations ALTER COLUMN id SET DEFAULT nextval('public.task_annotations_id_seq'::regclass);


--
-- TOC entry 3350 (class 2604 OID 23626804)
-- Name: task_leads id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_leads ALTER COLUMN id SET DEFAULT nextval('public.task_leads_id_seq'::regclass);


--
-- TOC entry 3352 (class 2604 OID 23626826)
-- Name: task_participants id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_participants ALTER COLUMN id SET DEFAULT nextval('public.task_participants_id_seq'::regclass);


--
-- TOC entry 3346 (class 2604 OID 23626789)
-- Name: tasks id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks ALTER COLUMN id SET DEFAULT nextval('public.tasks_id_seq'::regclass);


--
-- TOC entry 3421 (class 2604 OID 23627480)
-- Name: user_review_periods id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_review_periods ALTER COLUMN id SET DEFAULT nextval('public.user_review_periods_id_seq'::regclass);


--
-- TOC entry 3339 (class 2604 OID 23626756)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 3939 (class 0 OID 23627757)
-- Dependencies: 280
-- Data for Name: company_triggers; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.company_triggers (id, word, recommendation, created_at, updated_at) VALUES (1, 'лидерство', 'Рекомендуется развитие управленческих компетенций', '2025-10-31 18:51:13.578048', '2025-10-31 18:51:13.578048');
INSERT INTO public.company_triggers (id, word, recommendation, created_at, updated_at) VALUES (2, 'коммуникация', 'Рекомендуется тренинг по эффективной коммуникации', '2025-10-31 18:51:13.578048', '2025-10-31 18:51:13.578048');
INSERT INTO public.company_triggers (id, word, recommendation, created_at, updated_at) VALUES (3, 'инициатива', 'Рекомендуется включение в кросс-функциональные проекты', '2025-10-31 18:51:13.578048', '2025-10-31 18:51:13.578048');
INSERT INTO public.company_triggers (id, word, recommendation, created_at, updated_at) VALUES (4, 'планирование', 'Рекомендуется обучение навыкам проектного менеджмента', '2025-10-31 18:51:13.578048', '2025-10-31 18:51:13.578048');
INSERT INTO public.company_triggers (id, word, recommendation, created_at, updated_at) VALUES (5, 'аналитика', 'Рекомендуется развитие аналитических компетенций', '2025-10-31 18:51:13.578048', '2025-10-31 18:51:13.578048');
INSERT INTO public.company_triggers (id, word, recommendation, created_at, updated_at) VALUES (6, 'команда', 'Рекомендуется тренинг по командному взаимодействию', '2025-10-31 18:51:13.578048', '2025-10-31 18:51:13.578048');
INSERT INTO public.company_triggers (id, word, recommendation, created_at, updated_at) VALUES (7, 'конфликт', 'Рекомендуется обучение разрешению конфликтных ситуаций', '2025-10-31 18:51:13.578048', '2025-10-31 18:51:13.578048');
INSERT INTO public.company_triggers (id, word, recommendation, created_at, updated_at) VALUES (8, 'мотивация', 'Рекомендуется программа по саморазвитию и мотивации', '2025-10-31 18:51:13.578048', '2025-10-31 18:51:13.578048');
INSERT INTO public.company_triggers (id, word, recommendation, created_at, updated_at) VALUES (9, 'делегирование', 'Рекомендуется обучение эффективному делегированию', '2025-10-31 18:51:13.578048', '2025-10-31 18:51:13.578048');
INSERT INTO public.company_triggers (id, word, recommendation, created_at, updated_at) VALUES (10, 'обратная связь', 'Рекомендуется тренинг по предоставлению конструктивной обратной связи', '2025-10-31 18:51:13.578048', '2025-10-31 18:51:13.578048');


--
-- TOC entry 3885 (class 0 OID 23626922)
-- Dependencies: 226
-- Data for Name: employee_goals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employee_goals (id, user_id, cycle_id, goal_number, title, description, expected_deadline, expected_results, key_tasks, status, created_at, updated_at, rejection_comment, period_id) FROM stdin;
13	13	1	1	Изучить новые системы менеджмента	Описание	2026-10-09	Результаты	Задачки	approved	2025-11-02 17:23:07.98679	2025-11-02 17:23:31.8775	\N	\N
14	13	2	2	Цель	Описание	2025-12-31	Результат результативный	Задачи	approved	2025-11-02 17:26:04.419077	2025-11-02 17:26:32.013774	\N	\N
1	9	2	1	Внедрить микросервисную архитектуру	Разделить монолит на 5 независимых сервисов	\N	\N	\N	approved	2025-10-24 09:29:58.136102	2025-10-24 19:03:18.811696	\N	23
2	10	2	1	Повысить покрытие тестами до 80%	Написать unit и integration тесты для критичных модулей	\N	\N	\N	approved	2025-10-24 09:29:58.139194	2025-10-24 10:06:22.32098	\N	31
3	11	2	1	Изучить React и TypeScript	Освоить современный стек фронтенда	\N	\N	\N	approved	2025-10-24 09:29:58.141177	2025-10-24 09:44:07.3203	\N	32
4	11	2	2	Изучить Git		2025-12-08			approved	2025-10-24 09:43:36.248152	2025-10-28 18:53:10.176747	апафыалвы	32
5	12	2	1	Выучить английский язык	Мне надо!	2026-05-03			approved	2025-10-24 18:57:48.378049	2025-10-31 18:40:26.779266	Нет описания. Зачем?	26
6	13	2	1	Изучить новый стек		2026-06-01			approved	2025-10-24 19:02:04.673894	2025-10-24 19:06:16.0817	\N	33
10	9	2	\N	Тестовая цель 1	Описание тестовой цели 1	\N	\N	\N	approved	2025-10-29 17:36:28.809014	2025-10-29 17:37:44.814781	\N	23
11	9	2	\N	Тестовая цель 2	Описание тестовой цели 2	\N	\N	\N	approved	2025-10-29 17:36:28.809014	2025-10-29 17:37:39.717526	\N	23
12	9	2	\N	Тестовая цель 3	Описание тестовой цели 3	\N	\N	\N	approved	2025-10-29 17:36:28.809014	2025-10-29 17:37:42.311431	\N	23
\.


--
-- TOC entry 3933 (class 0 OID 23627639)
-- Dependencies: 274
-- Data for Name: employee_recommendations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employee_recommendations (id, employee_id, hr_id, achievements, improvements, development_plan, sent_at, is_read, created_at, period_id) FROM stdin;
6	9	3	• Отличное выполнение проекта по автоматизации HR-процессов\n• Внедрил систему аналитики для отдела продаж\n• Сократил время обработки отчетов на 40%	• Необходимо улучшить навыки планирования времени\n• Рекомендуется развить навыки управления проектами\n• Работа над коммуникацией с заинтересованными сторонами	• Пройти курс по Time Management (до января 2026)\n• Изучить Agile и Scrum методологии (до февраля 2026)\n• Получить сертификацию PMP или аналог (до июня 2026)\n• Возглавить проект средней сложности (Q1 2026)	2025-10-31 20:18:57.374814	t	2025-10-31 20:18:57.374814	\N
4	10	3	• Успешно завершила проект по внедрению новой CRM системы\n• Показала отличные навыки коммуникации с клиентами\n• Выполнила план продаж на 115%	• Рекомендуется улучшить навыки презентации\n• Развить знания в области аналитики данных\n• Работа над делегированием задач	• Пройти курс "Эффективные презентации" (до марта 2026)\n• Изучить основы SQL и Power BI (до апреля 2026)\n• Участвовать в качестве ментора для нового сотрудника\n• Посетить конференцию по продажам (Q1 2026)	2025-10-31 20:18:57.369584	f	2025-10-31 20:18:57.369584	\N
5	13	3	• Реализовал 5 ключевых фич для мобильного приложения\n• Улучшил производительность API на 30%\n• Провел 3 технических воркшопа для команды	• Необходимо улучшить навыки code review\n• Рекомендуется больше внимания уделять документации\n• Развитие soft skills для работы с заказчиками	• Пройти курс "Clean Code и рефакторинг" (до февраля 2026)\n• Написать техническую документацию для 3 модулей (до марта 2026)\n• Стать code reviewer для джуниор разработчиков\n• Изучить основы архитектуры микросервисов (Q1 2026)	2025-10-31 20:18:57.372663	t	2025-10-31 20:18:57.372663	\N
7	7	3	• Успешно руководил командой из 5 человек\n• Завершил 8 проектов в срок и в рамках бюджета\n• Повысил удовлетворенность клиентов на 20%	• Рекомендуется развить навыки стратегического планирования\n• Улучшить делегирование и развитие команды\n• Больше внимания уделять инновациям	• Пройти курс "Стратегический менеджмент" (до марта 2026)\n• Внедрить систему KPI для команды (до февраля 2026)\n• Организовать ежемесячные innovation sessions\n• Пройти executive MBA или аналог (начать в Q2 2026)	2025-10-31 20:18:57.377453	f	2025-10-31 20:18:57.377453	\N
8	8	3	• Разработала новую систему подбора персонала\n• Сократила время закрытия вакансий на 25%\n• Организовала 10 успешных корпоративных мероприятий	• Необходимо углубить знания в области компенсаций и льгот\n• Развить навыки работы с HR-аналитикой\n• Улучшить знание трудового законодательства	• Пройти курс "Compensation & Benefits Management" (до апреля 2026)\n• Освоить HR-аналитику и метрики (до марта 2026)\n• Получить сертификацию HRCI или SHRM (до июня 2026)\n• Внедрить новую систему оценки кандидатов (Q1 2026)	2025-10-31 20:18:57.380682	f	2025-10-31 20:18:57.380682	\N
10	11	3	• Оптимизировал финансовые процессы компании\n• Сократил издержки на 15% без потери качества\n• Внедрил новую систему бюджетирования	• Необходимо развить навыки финансового прогнозирования\n• Рекомендуется изучить международные стандарты отчетности\n• Улучшить презентационные навыки для совета директоров	• Пройти курс "Financial Forecasting and Planning" (до марта 2026)\n• Изучить IFRS и US GAAP (до апреля 2026)\n• Пройти курс "Презентация финансовых данных" (до февраля 2026)\n• Подготовить стратегический финансовый план на 3 года (Q1 2026)	2025-10-31 20:18:57.384272	f	2025-10-31 20:18:57.384272	\N
9	12	3	• Создала комплексную стратегию контент-маркетинга\n• Увеличила органический трафик на 50%\n• Запустила 3 успешные рекламные кампании	• Рекомендуется изучить SEO оптимизацию глубже\n• Развить навыки видео-продукции\n• Улучшить аналитические навыки (Google Analytics, Яндекс.Метрика)	• Пройти курс "Advanced SEO" (до февраля 2026)\n• Освоить видеомонтаж и создание роликов (до марта 2026)\n• Получить сертификацию Google Analytics (до января 2026)\n• Запустить подкаст компании (Q1 2026)	2025-10-31 20:18:57.382479	t	2025-10-31 20:18:57.382479	\N
11	9	3	Иван Иванов продемонстрировал высокие результаты в своей работе за оцениваемый период. Согласно самооценке, он оценил свою работу на 9.33/10, что свидетельствует о его высокой оценке своих достижений. \n\nОдним из ключевых достижений Ивана является его результативность, оцененная руководителем на уровне 8.0/10. Хотя детали оценки руководителя не предоставлены, этот балл свидетельствует о высокой оценке его работы.\n\nКоллеги Ивана также отметили его сильные стороны в различных аспектах работы. В частности, они оценили его эффективность в совместной работе на 4.0/5. Как отметила Анна Сидорова, Иван показал высокий уровень эффективности в совместной работе.\n\nКроме того, Иван продемонстрировал высокий уровень профессионализма, конструктивности в общении, ответственности и готовности помогать коллегам, о чем свидетельствуют отзывы коллег. Все эти качества получили оценку 3.0/5.\n\nСогласно оценке потенциала, Иван имеет средний результат и средний потенциал, что свидетельствует о его хороших перспективах для роста и развития в компании.\n\nВ целом, Иван Иванов показал себя как результативный и профессиональный сотрудник, который эффективно работает в команде и демонстрирует высокий уровень ответственности и готовности помогать коллегам.	Области для улучшения и развития:\n\n1. Улучшение коммуникативных навыков: Иван Иванов имеет высокую самооценку (9,33/10), но оценка коллег по конструктивности в общении составляет 3,0/5. Это указывает на возможную переоценку своих навыков общения. Коллега Анна Сидорова отметила, что Иван Иванов имеет сложности с конструктивным общением.\n\n2. Развитие ответственности: Оценка коллег по ответственности также составляет 3,0/5. Это говорит о том, что Иван Иванов может улучшить свою ответственность за выполняемую работу.\n\n3. Повышение профессионализма: Оценка коллег по профессионализму составляет 3,0/5, что указывает на необходимость развития профессиональных навыков.\n\n4. Улучшение готовности помогать коллегам: Оценка коллег по готовности помогать составляет 3,0/5. Это говорит о том, что Иван Иванов может улучшить свою готовность к сотрудничеству и поддержке коллег.\n\n5. Развитие навыков эффективного взаимодействия: Оценка коллег по эффективности совместной работы составляет 4,0/5, что является более высоким показателем, но все еще имеет потенциал для роста.\n\nРекомендации для развития:\n\n- Пройти тренинги по эффективным коммуникациям и взаимодействию с коллегами.\n- Улучшить навыки планирования и организации работы для повышения ответственности.\n- Развить профессиональные навыки через дополнительное обучение или курсы.\n- Принимать участие в командных проектах для улучшения навыков сотрудничества.\n\nЭти рекомендации основаны на данных из оценок и направлены на развитие конкретных навыков и компетенций, необходимых для роста и улучшения работы Ивана Иванова.	1. РАЗВИТИЕ СИЛЬНЫХ СТОРОН\n\nИвану необходимо продолжать развивать свои сильные стороны, такие как результативность и эффективность в работе. Чтобы усилить эти навыки, рекомендуется:\n- Принять участие в проекте, требующем высокой степени самоорганизации и управления временем.\n- Посещать семинары по эффективным методам работы и производительности.\n\n2. РАБОТА НАД ОБЛАСТЯМИ УЛУЧШЕНИЯ\n\nДля улучшения слабых сторон Ивану необходимо:\n- Пройти курсы по развитию коммуникативных навыков, такие как "Эффективная коммуникация" на Coursera или "Навыки общения" на LinkedIn Learning.\n- Участвовать в тренингах по лидерству и управлению командой, например, "Лидерство" на edX.\n- Читать книги по развитию мягких навыков, такие как "7 навыков высокоэффективных людей" Стивена Кови.\n\n3. КАРЬЕРНОЕ РАЗВИТИЕ\n\nДля карьерного роста Ивану рекомендуется:\n- Принять участие в проектах, требующих высокой степени ответственности и самостоятельности.\n- Развивать лидерские качества, посещая семинары и тренинги по лидерству.\n- Рассмотреть возможность получения дополнительной квалификации или сертификата.\n\n4. КОНКРЕТНЫЕ ШАГИ\n\nВ ближайшие 3 месяца:\n- Пройти курс "Эффективная коммуникация" на Coursera.\n- Принять участие в проекте, требующем высокой степени самоорганизации.\n\nВ течение 3-6 месяцев:\n- Посетить семинар по лидерству.\n- Начать читать книги по развитию мягких навыков.\n\nВ течение 6-12 месяцев:\n- Получить дополнительную квалификацию или сертификат.\n- Принять участие в проекте, требующем высокой степени ответственности.\n\nТакой план позволит Ивану развить свои сильные стороны, улучшить слабые стороны и продвинуться в карьере.	2025-11-02 14:21:39.247744	t	2025-11-02 14:21:39.247744	\N
12	9	\N	Иван Иванов продемонстрировал высокие результаты в своей работе за оцениваемый период. Он получил высокую самооценку - 9.33/10, что свидетельствует о его уверенности в своих достижениях. Оценка руководителя составила 8.0/10, что также является высоким показателем.\n\nКоллеги Ивана в своих отзывах (360°) отметили его сильные стороны, такие как эффективность совместной работы - 4.0/5, а также конструктивность в общении, ответственность и профессионализм - по 3.0/5. Анна Сидорова, одна из коллег, оценила его эффективность совместной работы как 4.0/5 и отметила, что он способен работать эффективно в команде.\n\nВ проекте "Главная на своих скрингридах" Иван Иванов показал себя с лучшей стороны. Хотя детали проекта не предоставлены, отзывы коллег свидетельствуют о его высокой результативности в этой работе.\n\nИван Иванов имеет средний результат и средний потенциал по оценке 9-Box, что указывает на его способность достигать хороших результатов и потенциал для роста. Рекомендация о готовности к продвижению через 1-2 года также подтверждает его высокие достижения и перспективы.\n\nВ целом, Иван Иванов продемонстрировал высокие достижения в своей работе, получил положительные отзывы от коллег и имеет хорошие перспективы для роста и развития в компании.	2. Развитие ответственности: Оценка коллег по ответственности также составляет 3,0/5. Это говорит о том, что Иван Иванов мог бы взять на себя больше ответственности в работе.\n\n3. Повышение профессионализма: Оценка коллег по профессионализму составляет 3,0/5, что указывает на необходимость развития профессиональных навыков.\n\n4. Улучшение готовности помогать коллегам: Оценка коллег по готовности помогать составляет 3,0/5. Это говорит о том, что Иван Иванов мог бы быть более готовым помогать коллегам.\n\n5. Развитие навыков эффективного взаимодействия: Хотя оценка коллег по эффективности совместной работы составляет 4,0/5, это все еще ниже самооценки и оценки руководителя. Иван Иванов мог бы работать над улучшением навыков взаимодействия с коллегами.\n\nЭти области для улучшения обоснованы данными из оценок и могут быть использованы для разработки плана развития Ивана Иванова.	Ивану Иванову необходимо продолжать развивать свою результативность, которая уже оценена на высоком уровне. Чтобы усилить эту сильную сторону, рекомендуется взять на себя руководство небольшим проектом в течение ближайших 3 месяцев. Это позволит Ивану не только показать свою способность управлять задачами, но и развить навыки лидерства. Кроме того, Ивану следует активно делиться своим опытом и знаниями с коллегами, что улучшит его взаимодействие в команде.\n\n2. РАБОТА НАД ОБЛАСТЯМИ УЛУЧШЕНИЯ\nСогласно отзывам коллег, Ивану необходимо улучшить конструктивность в общении, ответственность и профессионализм. Для этого рекомендуется пройти тренинг "Эффективное общение" в компании "Кадровый резерв" и прочитать книгу "Общение без конфликтов" Р. Фишера и У. Юри. Кроме того, Ивану следует взять на себя дополнительные задачи в команде, чтобы повысить свою ответственность и продемонстрировать готовность помогать коллегам.\n\n3. КАРЬЕРНОЕ РАЗВИТИЕ\nУчитывая оценку потенциала и позицию в 9-Box матрице, Ивану рекомендуется рассмотреть возможность перехода на более ответственную роль через 1-2 года. В ближайшее время Ивану следует сосредоточиться на развитии лидерских качеств и повышении своей результативности. Рекомендуется также рассмотреть возможность участия в программе наставничества, где Иван сможет получить советы от более опытных коллег.\n\n4. КОНКРЕТНЫЕ ШАГИ С СРОКАМИ\nБлижайшие 3 месяца:\n- Пройти тренинг "Эффективное общение" в компании "Кадровый резерв"\n- Взять на себя руководство небольшим проектом\n- Читать книгу "Общение без конфликтов" Р. Фишера и У. Юри\n\n3-6 месяцев:\n- Пройти курс "Лидерство в команде" на портале Coursera\n- Принять участие в программе наставничества\n\n6-12 месяцев:\n- Подать заявку на более ответственную роль в компании\n- Продолжать развивать лидерские качества и повышать результативность	2025-11-02 14:32:44.863782	t	2025-11-02 14:32:44.863782	13
13	12	\N	**Стиль управления:**\nОльга - креативный маркетолог с сильными навыками контент-маркетинга, нуждается в развитии технических навыков.\n\n**Рекомендации по взаимодействию:**\n• Давайте свободу в креативных решениях, но ставьте измеримые KPI\n• Обсужд	айте результаты кампаний с точки зрения метрик\n• Поддержите в изучении SEO и аналитики\n• Поощряйте эксперименты с новыми форматами контента\n\n**Зоны роста:**\n• SEO и техническая оптимизация - организуйте обучение\n• Видео-производство - дайте прое	кт для практики\n• Аналитика (GA, Метрика) - требуйте data-driven отчеты\n\n**Мотивация:** Креативная свобода, видимые результаты кампаний, новые форматы контента\n\n**Осторожно:** Может увлекаться креативом без анализа эффективности, требуйте метрики	2025-11-02 16:58:52.76671	f	2025-11-02 16:58:52.76671	26
14	7	\N	**Стиль управления:**\nКирилл - опытный менеджер, нуждающийся в развитии стратегического мышления и делегирования.\n\n**Рекомендации по взаимодействию:**\n• Вовлекайте в стратегическое планирование компании\n• Обсуждайте долгосрочные цели и KPI, а не только текущие з	адачи\n• Поддержите в развитии навыков делегирования - показывайте примеры\n• Создавайте возможности для инноваций в его команде\n\n**Зоны роста:**\n• Стратегическое планирование - давайте проекты с долгосрочной перспективой\n• Развитие команды - поощряйте менторство 	и обучение подчиненных\n• Внедрение инноваций - выделите time и ресурсы для innovation sessions\n\n**Мотивация:** Стратегические вызовы, развитие команды, влияние на бизнес-процессы\n\n**Осторожно:** Может углубляться в операционку, напоминайте о стратегических задачах	2025-11-02 16:58:52.777887	f	2025-11-02 16:58:52.777887	28
15	8	\N	**Стиль управления:**\nМария - HR профессионал с творческим подходом, ценит систематичность и возможность влиять на корпоративную культуру.\n\n**Рекомендации по взаимодействию:**\n• Давайте проекты по улучшению HR-процессов и корпоративной культуры\n• Поддерживай	те в изучении HR-аналитики и метрик\n• Вовлекайте в стратегические HR-инициативы\n• Цените креативный подход к мероприятиям и подбору\n\n**Зоны роста:**\n• Компенсации и льготы - поддержите в профессиональном обучении\n• HR-аналитика - давайте задачи с data-driven	 подходом\n• Трудовое право - организуйте курсы или консультации с юристами\n\n**Мотивация:** Влияние на культуру компании, признание креативных решений, профессиональное развитие\n\n**Осторожно:** Может уделять слишком много внимания мероприятиям в ущерб аналитике	2025-11-02 16:58:52.780504	f	2025-11-02 16:58:52.780504	29
16	11	\N	**Стиль управления:**\nПетр - финансист-аналитик с сильными техническими навыками, ценит точность и структурированность.\n\n**Рекомендации по взаимодействию:**\n• Вовлекайте в стратегическое финансовое планирование\n• Обсуждайте финансовые прогнозы и их влияние на 	бизнес-решения\n• Давайте проекты по оптимизации процессов\n• Поддержите в развитии презентационных навыков\n\n**Зоны роста:**\n• Финансовое прогнозирование - дайте ответственность за бюджет компании\n• Международные стандарты отчетности - организуйте обучение\n• Пре	зентационные навыки - практикуйте через регулярные отчеты руководству\n\n**Мотивация:** Сложные аналитические задачи, влияние на финансовые решения, профессиональное признание\n\n**Осторожно:** Может слишком углубляться в детали, помогайте видеть "большую картину"	2025-11-02 16:58:52.783287	f	2025-11-02 16:58:52.783287	32
17	13	\N	**Стиль управления:**\nДмитрий - технический эксперт, который ценит четкие цели и автономность в их достижении. Предпочитает структурированный подход и измеримые результаты.\n\n**Рекомендации по взаимодействию:**\n• Ставьте четкие, измеримые технические цели с конкретными дедлайнами\n• Вовлекайте в co	de review процесс - это поможет развить его навыки менторства\n• Обсуждайте архитектурные решения, спрашивайте его экспертное мнение\n• Давайте возможность проводить технические воркшопы для команды\n\n**Зоны роста:**\n• Развитие soft skills - поощряйте участие во встречах с заказчиками\n• Улучшение до	кументирования кода - покажите важность для команды\n• Навыки менторства - назначьте его code reviewer для джуниоров\n\n**Мотивация:** Технические вызовы, признание экспертизы, возможность обучать других\n\n**Осторожно:** Может уходить "в код" и игнорировать командную работу, следите за вовлеченностью	2025-11-02 16:58:52.785782	t	2025-11-02 16:58:52.785782	33
18	13	3	Дмитрий Смирнов демонстрирует высокие результаты в своей работе, о чем свидетельствуют отзывы его коллег и оценка его работы в команде. Согласно отзывам, Дмитрий показывает отличные результаты в таких аспектах, как конструктивность в общении, профессионализм и готовность помогать коллегам. \n\nАнна Сидорова оценила Дмитрия на 5 баллов из 5 в таких аспектах, как конструктивность в общении, профессионализм и готовность помогать коллегам. В частности, она отметила его способность работать эффективно в команде и достигать высоких результатов.\n\nТакже, согласно отзыву Анны Сидоровой, Дмитрий Смирнов имеет высокий уровень ответственности, хотя в оценке руководителя этот аспект не был отмечен. \n\nВ целом, Дмитрий Смирнов демонстрирует высокий уровень профессионализма и результативности в своей работе, о чем свидетельствуют многочисленные положительные отзывы его коллег.	Области для улучшения и развития Дмитрия Смирнова:\n\n1. Развитие ответственности: оценка руководителя составляет 0,0/10, а коллеги оценивают ответственность на 3,0/5. Это указывает на необходимость улучшения ответственности и исполнительности в работе.\n\n2. Развитие навыков эффективного взаимодействия с руководителем: оценка руководителя по профессиональным и личным качествам составляет 0,0, что существенно отличается от самооценки Дмитрия Смирнова (6,0/10) и оценки коллег (9,2/10). Это может свидетельствовать о необходимости улучшения коммуникации и взаимодействия с руководителем.\n\n3. Развитие навыков конструктивного общения: несмотря на высокую оценку коллег по конструктивности в общении (5,0/5), оценка руководителя отсутствует, что может указывать на необходимость улучшения навыков общения с руководителем и другими сотрудниками.\n\n4. Развитие результативности: оценка руководителя по общей результативности составляет 0,0/10, что существенно отличается от оценки коллег (9,2/10). Это может указывать на необходимость улучшения результативности и эффективности в работе.\n\nРекомендации для развития: \n\n- Улучшить коммуникацию и взаимодействие с руководителем.\n- Развить ответственность и исполнительность в работе.\n- Улучшить результативность и эффективность в работе.\n- Сохранить и развивать сильные стороны, отмеченные коллегами: профессионализм, готовность помогать коллегам и эффективность совместной работы.	1. РАЗВИТИЕ СИЛЬНЫХ СТОРОН\nДмитрий Смирнов продемонстрировал высокие результаты в профессионализме, конструктивности в общении, готовности помогать коллегам и эффективности совместной работы, согласно отзывам коллег. Чтобы усилить эти сильные стороны, рекомендуется продолжать активно участвовать в проектах, где он может проявлять эти качества. Дмитрий может взять на себя роль наставника для новых сотрудников, что поможет ему развить лидерские качества и закрепить свои сильные стороны.\n\n2. РАБОТА НАД ОБЛАСТЯМИ УЛУЧШЕНИЯ\nУчитывая низкую оценку результативности от руководителя и самооценку 6.0/10, Дмитрию необходимо улучшить свою результативность и профессиональные качества. Рекомендуется пройти курсы по тайм-менеджменту и продуктивности, такие как "Тайм-менеджмент" на Coursera или "Продуктивность" на LinkedIn Learning. Также полезно будет прочитать книги по теме, например "7 навыков высокоэффективных людей" Стивена Кови. Дмитрию следует работать над улучшением своих навыков планирования и выполнения задач, чтобы повысить свою результативность.\n\n3. КАРЬЕРНОЕ РАЗВИТИЕ\nУчитывая позицию Дмитрия в 9-Box матрице как "Средний результат / Средний потенциал" и готовность к продвижению через 1-2 года, ему можно предложить участие в новых проектах, где он сможет проявить себя. Рекомендуется рассмотреть возможность повышения в должности или расширения зоны ответственности. Для развития лидерских качеств Дмитрию можно пройти тренинги, такие как "Лидерство" на edX или "Управление командой" на Udemy.\n\n4. КОНКРЕТНЫЕ ШАГИ С СРОКАМИ\nБлижайшие 3 месяца:\n- Пройти курс "Тайм-менеджмент" на Coursera.\n- Прочитать книгу "7 навыков высокоэффективных людей" Стивена Кови.\n- Взять на себя роль наставника для новых сотрудников.\n\n3-6 месяцев:\n- Участвовать в новом проекте в качестве руководителя команды.\n- Пройти тренинг "Лидерство" на edX.\n\n6-12 месяцев:\n- Рассмотреть возможность повышения в должности или расширения зоны ответственности.\n- Пройти оценку 360° повторно, чтобы отслеживать прогресс.	2025-11-02 17:18:33.399271	f	2025-11-02 17:18:33.399271	\N
19	13	\N	Дмитрий Смирнов демонстрирует высокие результаты в своей работе, о чем свидетельствуют отзывы его коллег и оценка его работы в команде. Согласно отзывам, Дмитрий показывает отличные результаты в таких аспектах, как конструктивность в общении, профессионализм и готовность помогать коллегам. \n\nАнна Сидорова оценила Дмитрия на 5 баллов из 5 в таких аспектах, как конструктивность в общении, профессионализм и готовность помогать коллегам. В частности, она отметила его способность работать эффективно в команде и достигать высоких результатов.\n\nТакже, согласно отзыву Анны Сидоровой, Дмитрий Смирнов имеет высокий уровень ответственности, хотя в оценке руководителя этот аспект не был отмечен. \n\nВ целом, Дмитрий Смирнов демонстрирует высокий уровень профессионализма и результативности в своей работе, о чем свидетельствуют многочисленные положительные отзывы его коллег.	Области для улучшения и развития Дмитрия Смирнова:\n\n1. Развитие ответственности: оценка руководителя составляет 0,0/10, а коллеги оценивают ответственность на 3,0/5. Это указывает на необходимость улучшения ответственности и исполнительности в работе.\n\n2. Развитие навыков эффективного взаимодействия с руководителем: оценка руководителя по профессиональным и личным качествам составляет 0,0, что существенно отличается от самооценки Дмитрия Смирнова (6,0/10) и оценки коллег (9,2/10). Это может свидетельствовать о необходимости улучшения коммуникации и взаимодействия с руководителем.\n\n3. Развитие навыков конструктивного общения: несмотря на высокую оценку коллег по конструктивности в общении (5,0/5), оценка руководителя отсутствует, что может указывать на необходимость улучшения навыков общения с руководителем и другими сотрудниками.\n\n4. Развитие результативности: оценка руководителя по общей результативности составляет 0,0/10, что существенно отличается от оценки коллег (9,2/10). Это может указывать на необходимость улучшения результативности и эффективности в работе.\n\nРекомендации для развития: \n\n- Улучшить коммуникацию и взаимодействие с руководителем.\n- Развить ответственность и исполнительность в работе.\n- Улучшить результативность и эффективность в работе.\n- Сохранить и развивать сильные стороны, отмеченные коллегами: профессионализм, готовность помогать коллегам и эффективность совместной работы.	1. РАЗВИТИЕ СИЛЬНЫХ СТОРОН\nДмитрий Смирнов продемонстрировал высокие результаты в профессионализме, конструктивности в общении, готовности помогать коллегам и эффективности совместной работы, согласно отзывам коллег. Чтобы усилить эти сильные стороны, рекомендуется продолжать активно участвовать в проектах, где он может проявлять эти качества. Дмитрий может взять на себя роль наставника для новых сотрудников, что поможет ему развить лидерские качества и закрепить свои сильные стороны.\n\n2. РАБОТА НАД ОБЛАСТЯМИ УЛУЧШЕНИЯ\nУчитывая низкую оценку результативности от руководителя и самооценку 6.0/10, Дмитрию необходимо улучшить свою результативность и профессиональные качества. Рекомендуется пройти курсы по тайм-менеджменту и продуктивности, такие как "Тайм-менеджмент" на Coursera или "Продуктивность" на LinkedIn Learning. Также полезно будет прочитать книги по теме, например "7 навыков высокоэффективных людей" Стивена Кови. Дмитрию следует работать над улучшением своих навыков планирования и выполнения задач, чтобы повысить свою результативность.\n\n3. КАРЬЕРНОЕ РАЗВИТИЕ\nУчитывая позицию Дмитрия в 9-Box матрице как "Средний результат / Средний потенциал" и готовность к продвижению через 1-2 года, ему можно предложить участие в новых проектах, где он сможет проявить себя. Рекомендуется рассмотреть возможность повышения в должности или расширения зоны ответственности. Для развития лидерских качеств Дмитрию можно пройти тренинги, такие как "Лидерство" на edX или "Управление командой" на Udemy.\n\n4. КОНКРЕТНЫЕ ШАГИ С СРОКАМИ\nБлижайшие 3 месяца:\n- Пройти курс "Тайм-менеджмент" на Coursera.\n- Прочитать книгу "7 навыков высокоэффективных людей" Стивена Кови.\n- Взять на себя роль наставника для новых сотрудников.\n\n3-6 месяцев:\n- Участвовать в новом проекте в качестве руководителя команды.\n- Пройти тренинг "Лидерство" на edX.\n\n6-12 месяцев:\n- Рассмотреть возможность повышения в должности или расширения зоны ответственности.\n- Пройти оценку 360° повторно, чтобы отслеживать прогресс.	2025-11-02 17:19:03.88119	f	2025-11-02 17:19:03.873532	27
\.


--
-- TOC entry 3927 (class 0 OID 23627540)
-- Dependencies: 268
-- Data for Name: employee_review_periods; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employee_review_periods (id, user_id, name, start_date, end_date, is_active, created_at, status, manager_approved, manager_approved_at, manager_approved_by, hr_approved, hr_approved_at, hr_approved_by, self_assessment_completed, self_assessment_completed_at, peer_reviews_count, manager_evaluation_completed, manager_evaluation_completed_at, requested_early_at, manager_goals_evaluation_completed, manager_goals_evaluation_completed_at, peer_reviews_completed, cycle_id, potential_assessment_completed, calculated_at) FROM stdin;
34	9	Performance Review 2025 - ноябрь	2025-11-30	2026-05-30	t	2025-11-02 14:32:44.929427	not_started	f	\N	\N	f	\N	\N	f	\N	0	f	\N	\N	f	\N	f	1	f	\N
23	9	Полугодие 2 - 2025 (Иван)	2025-07-01	2025-12-31	f	2025-10-30 19:12:31.640948	not_started	f	\N	\N	f	\N	\N	f	\N	0	f	\N	\N	f	\N	f	2	f	\N
13	9	Полугодие 1 - 2025 (Иван)	2025-05-31	2025-11-29	f	2025-10-30 15:25:55.789972	completed	t	2025-10-30 17:59:37.703606	7	t	2025-10-30 18:09:07.85143	3	t	2025-10-30 18:28:19.629138	0	f	\N	2025-10-30 17:59:13.597189	t	2025-10-30 20:56:21.568197	t	1	t	2025-11-02 14:32:44.873904
17	11	Полугодие 1 - 2024	2024-01-01	2024-06-30	t	2025-10-30 15:25:55.799254	completed	f	\N	\N	f	\N	\N	f	\N	0	f	\N	\N	f	\N	f	\N	f	\N
18	11	Полугодие 2 - 2024	2024-07-01	2024-12-31	t	2025-10-30 15:25:55.799254	completed	f	\N	\N	f	\N	\N	f	\N	0	f	\N	\N	f	\N	f	\N	f	\N
19	12	Полугодие 1 - 2024	2024-01-01	2024-06-30	t	2025-10-30 15:25:55.802054	completed	f	\N	\N	f	\N	\N	f	\N	0	f	\N	\N	f	\N	f	\N	f	\N
20	12	Полугодие 2 - 2024	2024-07-01	2024-12-31	t	2025-10-30 15:25:55.802054	completed	f	\N	\N	f	\N	\N	f	\N	0	f	\N	\N	f	\N	f	\N	f	\N
14	9	Полугодие 2 - 2024	2024-07-01	2024-12-31	f	2025-10-30 15:25:55.789972	completed	f	\N	\N	f	\N	\N	f	\N	0	f	\N	\N	f	\N	f	\N	f	\N
25	11	Полугодие 1 - 2025 (Петр)	2025-06-15	2025-12-15	t	2025-10-30 19:23:10.834932	not_started	f	\N	\N	f	\N	\N	f	\N	0	f	\N	\N	f	\N	f	1	f	\N
27	13	Полугодие 1 - 2025 (Дмитрий)	2025-06-10	2025-12-10	t	2025-10-30 19:23:10.840883	completed	t	2025-11-02 17:08:57.48686	8	t	2025-11-02 17:09:12.151164	3	t	2025-11-02 17:10:08.839224	0	f	\N	2025-11-02 17:08:45.644077	t	2025-11-02 17:16:29.576308	t	1	t	2025-11-02 17:19:03.880236
21	13	Полугодие 1 - 2024	2024-01-01	2024-06-30	f	2025-10-30 15:25:55.805262	completed	f	\N	\N	f	\N	\N	f	\N	0	f	\N	\N	f	\N	f	\N	f	\N
24	10	Полугодие 1 - 2025 (Анна)	2025-06-01	2025-11-30	t	2025-10-30 19:23:10.83	awaiting_calculation	t	2025-10-31 14:26:49.175215	7	t	2025-10-31 14:26:56.737762	3	t	2025-10-31 14:30:03.540405	0	f	\N	2025-10-31 14:26:40.657248	t	2025-10-31 14:35:58.382399	t	1	t	\N
28	7	Полугодие 2 - 2025 - Кирилл Менеджеров	2025-07-01	2025-12-31	t	2025-10-31 19:40:40.419448	completed	f	\N	\N	f	\N	\N	f	\N	0	f	\N	\N	f	\N	f	2	f	\N
29	8	Полугодие 2 - 2025 - Мария Петрова	2025-07-01	2025-12-31	t	2025-10-31 19:40:40.429601	completed	f	\N	\N	f	\N	\N	f	\N	0	f	\N	\N	f	\N	f	2	f	\N
22	13	Полугодие 2 - 2024	2024-07-01	2024-12-31	f	2025-10-30 15:25:55.805262	completed	f	\N	\N	f	\N	\N	f	\N	0	f	\N	\N	f	\N	f	\N	f	\N
32	11	Полугодие 2 - 2025 - Петр Петров	2025-07-01	2025-12-31	t	2025-10-31 19:41:11.025022	completed	f	\N	\N	f	\N	\N	f	\N	0	f	\N	\N	f	\N	f	2	f	\N
26	12	Полугодие 1 - 2025 (Ольга)	2025-07-01	2025-12-31	t	2025-10-30 19:23:10.838016	completed	f	\N	\N	f	\N	\N	f	\N	0	f	\N	\N	f	\N	f	2	f	\N
16	10	Полугодие 2 - 2024	2024-07-01	2024-12-31	f	2025-10-30 15:25:55.796592	completed	f	\N	\N	f	\N	\N	f	\N	0	f	\N	\N	f	\N	f	\N	f	\N
15	10	Полугодие 1 - 2024	2024-01-01	2024-06-30	f	2025-10-30 15:25:55.796592	completed	f	\N	\N	f	\N	\N	f	\N	0	f	\N	2025-10-30 16:18:16.212371	f	\N	f	\N	f	\N
33	13	Полугодие 2 - 2025 - Дмитрий Смирнов	2025-07-01	2025-12-31	f	2025-10-31 19:41:11.031106	completed	f	\N	\N	f	\N	\N	f	\N	0	f	\N	\N	f	\N	f	2	f	\N
31	10	Полугодие 2 - 2025 - Анна Сидорова	2025-07-01	2025-12-31	f	2025-10-31 19:41:11.021946	awaiting_calculation	f	\N	\N	f	\N	\N	f	\N	0	f	\N	\N	f	\N	f	2	f	\N
35	13	Performance Review 2025 - декабрь	2025-12-11	2026-06-11	t	2025-11-02 17:19:03.938081	not_started	f	\N	\N	f	\N	\N	f	\N	0	f	\N	\N	f	\N	f	1	f	\N
\.


--
-- TOC entry 3937 (class 0 OID 23627731)
-- Dependencies: 278
-- Data for Name: employee_summaries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employee_summaries (id, employee_id, cycle_id, summary_text, created_at, updated_at) FROM stdin;
1	3	2		2025-10-31 17:24:25.480408	2025-10-31 17:24:25.480408
\.


--
-- TOC entry 3881 (class 0 OID 23626860)
-- Dependencies: 222
-- Data for Name: employee_tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employee_tasks (id, user_id, task_id, cycle_id, task_order, created_at) FROM stdin;
\.


--
-- TOC entry 3911 (class 0 OID 23627253)
-- Dependencies: 252
-- Data for Name: final_reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.final_reviews (id, employee_id, cycle_id, self_assessment_total, peer_review_total, manager_review_total, potential_total, total_score, rating, rating_category, salary_increase_recommended, salary_increase_percent, status, final_feedback, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3891 (class 0 OID 23626986)
-- Dependencies: 232
-- Data for Name: form_sections; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.form_sections (id, template_id, title, description, display_order, section_type, is_collapsible, created_at) FROM stdin;
\.


--
-- TOC entry 3893 (class 0 OID 23627004)
-- Dependencies: 234
-- Data for Name: form_static_blocks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.form_static_blocks (id, template_id, section_id, block_type, content, display_order, created_at) FROM stdin;
\.


--
-- TOC entry 3889 (class 0 OID 23626969)
-- Dependencies: 230
-- Data for Name: form_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.form_templates (id, code, title, audience, purpose, applies_per, is_active, display_order, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3887 (class 0 OID 23626950)
-- Dependencies: 228
-- Data for Name: goal_tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.goal_tasks (id, goal_id, task_number, task_description, created_at) FROM stdin;
1	10	1	Тестовая задача 1	2025-10-29 17:36:28.809014
2	11	1	Тестовая задача 2	2025-10-29 17:36:28.809014
3	12	1	Тестовая задача 3	2025-10-29 17:36:28.809014
\.


--
-- TOC entry 3919 (class 0 OID 23627425)
-- Dependencies: 260
-- Data for Name: manager_evaluations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.manager_evaluations (id, employee_id, manager_id, cycle_id, professional_qualities_score, personal_qualities_score, communication_with_colleagues, employee_development_willingness, considers_as_successor, development_readiness, turnover_risk_score, priorities_from_opz, performance_total, potential_total, created_at, updated_at, result_achievement_rating, personal_qualities_comment, personal_contribution_comment, interaction_quality_rating, improvement_suggestions, overall_rating, feedback_summary, goal_id) FROM stdin;
16	7	3	2	3	4	\N	\N	\N	\N	\N	\N	6	7	2025-10-24 13:26:55.116922	2025-10-24 13:26:55.116922	\N	\N	\N	\N	\N	\N	\N	\N
20	10	7	2	5	4	t	t	t	1-2_years	1	\N	9	9	2025-10-24 17:07:57.064101	2025-10-24 17:07:57.064101	10	\N	\N	10	\N	10	Отличный сотрудник с высоким потенциалом роста	\N
21	9	7	2	5	4	t	t	f	3_years	2	\N	8	6	2025-10-24 17:07:57.079044	2025-10-24 17:07:57.079044	8	\N	\N	7	\N	8	Стабильные высокие результаты	\N
22	11	7	2	4	4	t	f	f	3_years	2	\N	7	6	2025-10-24 17:07:57.083051	2025-10-24 17:07:57.083051	7	\N	\N	7	\N	7	Надежный специалист	\N
23	12	7	2	3	3	f	t	f	3+_years	3	\N	5	5	2025-10-24 17:07:57.08633	2025-10-24 17:07:57.08633	5	\N	\N	5	\N	5	Средние результаты, есть потенциал	\N
24	13	7	2	2	2	f	f	f	not_ready	5	\N	3	2	2025-10-24 17:07:57.09077	2025-10-24 17:07:57.09077	3	\N	\N	3	\N	3	Требует значительного развития	\N
31	9	7	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-30 20:56:21.562174	2025-10-30 20:56:21.562174	8	Всегда выполняет все поставленные задачи четко в срок. Очень педантичен и аккуратен в работе	Он очень хорошо подгоняет команду, однозначный лидер	5	Быть мягче с коллегами, и проще относится к ошибкам команды	8	Иван Иванов продемонстрировал высокий уровень результативности и лидерских качеств в течение отчетного периода. Его общая оценка работы составляет 8/10.\n\nВ достижении результатов Иван показал себя с лучшей стороны, выполняя все поставленные задачи четко и в срок. Его педантичность и аккуратность в работе заслуживают высокой оценки. Как лидер, он очень хорошо подгоняет команду, и его вклад в командную работу неоспорим.\n\nОднако, оценка качества взаимодействия с коллегами составила 5/10. Обратная связь от коллег дает нам представление о том, что Иван иногда может быть резким во время горящих дедлайнов и не всегда внимателен к мнению других. Коллега 1, Content Manager, отметил, что Иван всегда четко выполняет обязанности, но иногда может грубить во время горящих дедлайнов. Коллега 2, Marketing Manager, оценил его взаимодействие как среднее, дав оценку 7/10. Коллега 3, Middle Developer, дал более низкую оценку, отметив, что Иван порой ведет себя как царь и не всегда внимателен к коллегам.\n\nСамооценка Ивана показывает, что он активно работал над развитием своих навыков, изучая новые технологии React и Node.js, и применил их в проекте. Он также прошел курс по архитектуре приложений и успешно завершил все запланированные задачи, реализовав новую функциональность для системы Performance Review и улучшив производительность на 30%.\n\nКлючевые сильные стороны Ивана - это его лидерские качества, умение работать в команде, и высокий уровень исполнительности. Он всегда выполняет задачи в срок и аккуратно подходит к работе.\n\nОднако, есть несколько областей, где Ивану необходимо улучшиться. Во-первых, ему необходимо работать над коммуникативными навыками и быть более внимательным к коллегам. Это включает в себя умение слушать и учитывать мнение других, а также более конструктивно выражать свои мысли и замечания.\n\nВо-вторых, Ивану необходимо быть более гибким и адаптивным в работе с командой. Это означает, что ему нужно быть более терпимым к ошибкам и неудачам, и не требовать идеальности от других.\n\nВ-третьих, Ивану необходимо продолжать развивать свои технические навыки, в том числе в направлении архитектуры систем, изучении микросервисов и cloud-технологий.\n\nВ целом, Иван показал себя как сильный и результативный сотрудник, и я уверен, что с учетом рекомендаций и областей для развития, он сможет еще больше улучшить свои результаты и вырасти как профессионал.	\N
32	10	7	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-31 14:35:58.375548	2025-10-31 14:35:58.375548	7	Анна демонстрирует хорошие технические навыки и внимание к деталям при тестировании. Её инициативность проявляется в предложениях по улучшению процессов (внедрение CI/CD). Обладает настойчивостью при решении сложных задач. В то же время, работает волнообразно — периоды высокой продуктивности чередуются с потерей фокуса. Требуется развивать систематичность подхода.	Как руководитель вижу, что Анна проактивно улучшала тестовый стек команды и помогала коллегам с инструментами. Однако качество её внутреннего взаимодействия оценивается коллегами неоднозначно — от отличного до нуждающегося в улучшении. Это говорит либо о необходимости лучше коммуницировать статус работы, либо о разном восприятии работы её разными партнёрами.	7	Коллеги дают противоречивые оценки (от 10/10 до 2/10). В среднем взаимодействие хорошее, но требует внимания. Анна должна улучшить прозрачность в коммуникации о статусе и потенциальных рисках. Рекомендуется также работать над консистентностью в общении с разными членами команды.	6	Завершая отчетный период, я хотел бы подвести итоги работы Анны Сидоровой и предоставить ей конструктивную обратную связь, направленную на ее профессиональный рост.\n\nВ целом, я оцениваю работу Анны за период на твердую 6/10. Этот результат отражает как значительные достижения, так и области для улучшения. Анна продемонстрировала хорошие технические навыки и внимание к деталям при тестировании, что является несомненной сильной стороной. Ее инициативность в предложениях по улучшению процессов, например, во внедрении CI/CD, заслуживает похвалы. Кроме того, она обладает настойчивостью при решении сложных задач, что является ценным качеством для специалиста в области тестирования.\n\nОднако, анализ работы Анны показывает, что ей не хватает систематичности в подходе. Ее работа характеризуется волнообразностью — периодами высокой продуктивности, чередующимися с потерей фокуса. Это требует развития с ее стороны для повышения общей эффективности.\n\nВ части взаимодействия с коллегами, Анна получает противоречивые оценки. Отличные отзывы от некоторых коллег, которые ценят ее профессионализм, внимание к деталям и готовность помочь, контрастируют с менее позитивными оценками от других. Это расхождение может быть связано либо с необходимостью улучшения коммуникации о статусе работы и потенциальных рисках, либо с разным восприятием ее работы разными партнерами.\n\nУчитывая обратную связь от коллег, становится ясно, что Анна воспринимается как образцовый профессионал и командный игрок некоторыми из них. Ее технические навыки, стратегическое мышление и готовность делиться опытом высоко ценятся. Однако, другие коллеги указывают на необходимость улучшения системности в работе, внимательности к деталям и навыков коммуникации.\n\nКлючевыми сильными сторонами Анны являются ее технические навыки, инициативность и настойчивость. Эти качества являются основой для ее профессионального роста и дальнейшего развития.\n\nВ то же время, есть конкретные области для развития. Во-первых, Анне необходимо работать над систематичностью своего подхода к работе, чтобы повысить эффективность и уменьшить волнообразность. Во-вторых, ей следует улучшить коммуникацию о статусе работы и потенциальных рисках, чтобы сделать взаимодействие с коллегами более прозрачным и эффективным. В-третьих, Анне рекомендуется развивать навыки принятия конструктивной критики без личных обид и улучшать дисциплину и ответственность за качество своей работы.\n\nДля улучшения, я рекомендую Анне сосредоточиться на следующих аспектах:\n\n1. Развитие систематичности в подходе к работе, включая более равномерное распределение усилий и фокуса на задачах.\n2. Улучшение коммуникации о статусе работы и потенциальных рисках для повышения прозрачности и доверия в команде.\n3. Развитие навыков принятия конструктивной критики и улучшение дисциплины и ответственности за качество работы.\n\nВ заключение, я вижу в Анне потенциал для роста и развития как специалиста в области тестирования. Сосредоточившись на указанных областях для улучшения и развивая свои сильные стороны, она может повысить свою эффективность и внести еще больший вклад в команду.	\N
33	13	8	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-02 17:16:29.569919	2025-11-02 17:16:29.569919	6	Хорошая экспертиза, Прекрасная коммуникация с коллегами	Всегда помогает коллегам разбираться с трудными задачами!	8	Быть более активным на проектах, хватает инициативности	7	Общая оценка работы Дмитрия Смирнова за отчетный период - 7/10. Этот результат отражает как достижения, так и области для роста, которые я детально проанализирую ниже.\n\nДмитрий продемонстрировал хорошую экспертизу в своей области, что было отмечено коллегами. Его способность разбираться с трудными задачами и помогать коллегам является несомненной сильной стороной. Коммуникация с коллегами также была на высоком уровне, о чем свидетельствуют оценки 8/10 по качеству взаимодействия.\n\nОднако, анализ достижения результата показал оценку 6/10. Это указывает на то, что Дмитрий мог бы быть более активным на проектах и проявлять больше инициативности. Именно это направление я бы хотел выделить как ключевое для развития.\n\nОбратная связь от коллег предоставляет ценную информацию о сильных сторонах и областях для роста Дмитрия. Коллега 1 отметил высокую степень экспертизы Дмитрия и предложил улучшить коммуникацию с коллегами, хотя оценка качества взаимодействия составила 10/10. Коллега 2 также отметил отличную экспертизу и коммуникацию. Коллега 3 выделил упорство и лидерские качества, но также отметил, что иногда Дмитрий может быть не вежлив в общении.\n\nИз этих отзывов можно сделать вывод, что Дмитрий обладает высокой экспертизой и отличными коммуникативными навыками, но есть некоторые аспекты, которые требуют внимания. В частности, необходимо работать над вежливостью в общении и проявлением инициативности на проектах.\n\nКлючевые сильные стороны Дмитрия - это экспертиза, способность помогать коллегам и хорошие коммуникативные навыки. Однако, есть и области для роста. Дмитрию необходимо работать над повышением активности на проектах и проявлением инициативности. Кроме того, необходимо уделить внимание вежливости в общении с коллегами.\n\nЧтобы улучшить результаты, я рекомендую Дмитрию следующие шаги:\n\n* Проявлять больше инициативности на проектах и активно участвовать в их реализации.\n* Продолжать развивать экспертизу и делиться знаниями с коллегами.\n* Уделять внимание вежливости в общении с коллегами и стремиться к конструктивному диалогу.\n\nВ заключение, я хочу отметить, что Дмитрий Смирнов является ценным членом команды и имеет большой потенциал для роста. С учетом рекомендаций и целенаправленной работы над развитием, я уверен, что Дмитрий сможет достичь еще более высоких результатов и внести еще больший вклад в команду.	\N
\.


--
-- TOC entry 3931 (class 0 OID 23627609)
-- Dependencies: 272
-- Data for Name: manager_recommendations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.manager_recommendations (id, employee_id, manager_id, hr_id, recommendations, sent_at, is_read, created_at, period_id) FROM stdin;
1	10	7	3	**Стиль управления:** \nАнна хорошо реагирует на делегирование ответственности и автономию. Она мотивирована вызовами и возможностью развивать новые навыки.\n\n**Рекомендации по взаимодействию:**\n• Проводите еженедельные 1-на-1 встречи для обсуждения прогресса и барьеров\n• Поощряйте ее инициативу в новых проектах, особенно связанных с CRM и аналитикой\n• Давайте конструктивную обратную связь сразу, не откладывая\n• Вовлекайте в стратегические обсуждения - она ценит понимание "большой картины"\n\n**Зоны роста:**\n• Помогите развить навыки презентации через практику и feedback\n• Поддержите в изучении аналитических инструментов (предложите курсы)\n• Обсуждайте делегирование - научите передавать рутинные задачи\n\n**Мотивация:** Признание достижений, новые вызовы, профессиональное развитие\n\n**Осторожно:** Может перегружать себя работой, следите за work-life balance	2025-10-31 20:32:05.185889	f	2025-10-31 20:32:05.185889	31
2	13	7	3	**Стиль управления:**\nДмитрий - технический эксперт, который ценит четкие цели и автономность в их достижении. Предпочитает структурированный подход и измеримые результаты.\n\n**Рекомендации по взаимодействию:**\n• Ставьте четкие, измеримые технические цели с конкретными дедлайнами\n• Вовлекайте в code review процесс - это поможет развить его навыки менторства\n• Обсуждайте архитектурные решения, спрашивайте его экспертное мнение\n• Давайте возможность проводить технические воркшопы для команды\n\n**Зоны роста:**\n• Развитие soft skills - поощряйте участие во встречах с заказчиками\n• Улучшение документирования кода - покажите важность для команды\n• Навыки менторства - назначьте его code reviewer для джуниоров\n\n**Мотивация:** Технические вызовы, признание экспертизы, возможность обучать других\n\n**Осторожно:** Может уходить "в код" и игнорировать командную работу, следите за вовлеченностью	2025-10-31 20:32:05.19147	f	2025-10-31 20:32:05.19147	33
4	7	7	3	**Стиль управления:**\nКирилл - опытный менеджер, нуждающийся в развитии стратегического мышления и делегирования.\n\n**Рекомендации по взаимодействию:**\n• Вовлекайте в стратегическое планирование компании\n• Обсуждайте долгосрочные цели и KPI, а не только текущие задачи\n• Поддержите в развитии навыков делегирования - показывайте примеры\n• Создавайте возможности для инноваций в его команде\n\n**Зоны роста:**\n• Стратегическое планирование - давайте проекты с долгосрочной перспективой\n• Развитие команды - поощряйте менторство и обучение подчиненных\n• Внедрение инноваций - выделите time и ресурсы для innovation sessions\n\n**Мотивация:** Стратегические вызовы, развитие команды, влияние на бизнес-процессы\n\n**Осторожно:** Может углубляться в операционку, напоминайте о стратегических задачах	2025-10-31 20:32:05.195327	f	2025-10-31 20:32:05.195327	28
5	8	7	3	**Стиль управления:**\nМария - HR профессионал с творческим подходом, ценит систематичность и возможность влиять на корпоративную культуру.\n\n**Рекомендации по взаимодействию:**\n• Давайте проекты по улучшению HR-процессов и корпоративной культуры\n• Поддерживайте в изучении HR-аналитики и метрик\n• Вовлекайте в стратегические HR-инициативы\n• Цените креативный подход к мероприятиям и подбору\n\n**Зоны роста:**\n• Компенсации и льготы - поддержите в профессиональном обучении\n• HR-аналитика - давайте задачи с data-driven подходом\n• Трудовое право - организуйте курсы или консультации с юристами\n\n**Мотивация:** Влияние на культуру компании, признание креативных решений, профессиональное развитие\n\n**Осторожно:** Может уделять слишком много внимания мероприятиям в ущерб аналитике	2025-10-31 20:32:05.197171	f	2025-10-31 20:32:05.197171	29
7	11	7	3	**Стиль управления:**\nПетр - финансист-аналитик с сильными техническими навыками, ценит точность и структурированность.\n\n**Рекомендации по взаимодействию:**\n• Вовлекайте в стратегическое финансовое планирование\n• Обсуждайте финансовые прогнозы и их влияние на бизнес-решения\n• Давайте проекты по оптимизации процессов\n• Поддержите в развитии презентационных навыков\n\n**Зоны роста:**\n• Финансовое прогнозирование - дайте ответственность за бюджет компании\n• Международные стандарты отчетности - организуйте обучение\n• Презентационные навыки - практикуйте через регулярные отчеты руководству\n\n**Мотивация:** Сложные аналитические задачи, влияние на финансовые решения, профессиональное признание\n\n**Осторожно:** Может слишком углубляться в детали, помогайте видеть "большую картину"	2025-10-31 20:32:05.201425	f	2025-10-31 20:32:05.201425	32
3	9	7	3	**Стиль управления:**\nИван - проактивный сотрудник с сильными аналитическими навыками, но нуждается в улучшении time management и приоритизации.\n\n**Рекомендации по взаимодействию:**\n• Помогите структурировать рабочий день - используйте техники тайм-менеджмента\n• Проводите регулярные check-in для отслеживания прогресса и корректировки приоритетов\n• Обсуждайте важность vs срочность задач\n• Поддержите в изучении Agile/Scrum методологий\n\n**Зоны роста:**\n• Планирование времени - научите использовать инструменты (календари, time blocking)\n• Управление ожиданиями stakeholders - отрабатывайте на практике\n• Делегирование и приоритизация - показывайте примеры\n\n**Мотивация:** Решение сложных задач, видимый impact на бизнес, развитие управленческих навыков\n\n**Осторожно:** Может брать слишком много задач одновременно, помогайте фокусироваться на главном	2025-10-31 20:32:05.193009	f	2025-10-31 20:32:05.193009	23
6	12	7	3	**Стиль управления:**\nОльга - креативный маркетолог с сильными навыками контент-маркетинга, нуждается в развитии технических навыков.\n\n**Рекомендации по взаимодействию:**\n• Давайте свободу в креативных решениях, но ставьте измеримые KPI\n• Обсуждайте результаты кампаний с точки зрения метрик\n• Поддержите в изучении SEO и аналитики\n• Поощряйте эксперименты с новыми форматами контента\n\n**Зоны роста:**\n• SEO и техническая оптимизация - организуйте обучение\n• Видео-производство - дайте проект для практики\n• Аналитика (GA, Метрика) - требуйте data-driven отчеты\n\n**Мотивация:** Креативная свобода, видимые результаты кампаний, новые форматы контента\n\n**Осторожно:** Может увлекаться креативом без анализа эффективности, требуйте метрики	2025-10-31 20:32:05.199025	f	2025-10-31 20:32:05.199025	26
8	9	7	3	## 1. ОБЩАЯ ОЦЕНКА И ВЫВОДЫ\n\nИван Иванов продемонстрировал высокую самооценку (9.33/10) и среднюю оценку от непосредственного руководителя (8.0/10). Однако, оценка коллег (360°) составила 6.4/10, что указывает на разногласия в восприятии его эффективности. Итоговый балл - 13.43/10. Отсутствие комментариев от руководителя и неполная информация о самооценке усложняют анализ. Текущая эффективность Ивана соответствует ожиданиям для его позиции, но есть потенциал для роста.\n\n## 2. АНАЛИЗ ПОТЕНЦИАЛА\n\nПозиция Ивана в 9-Box матрице определена как "Средний результат / Средний потенциал" с оценкой потенциала 6.0/10 и результативности 8.0/10. Готовность к продвижению оценена как "Через 1-2 года". Это указывает на необходимость развития и роста, чтобы достичь более высокого уровня. Прогноз траектории развития предполагает умеренный рост, но требует целенаправленных усилий для улучшения навыков и результативности.\n\n## 3. СТРАТЕГИЧЕСКИЕ РЕКОМЕНДАЦИИ\n\nДля Ивана, со средним потенциалом и результативностью, рекомендуется:\n- Укрепить навыки в областях, указанных коллегами (конструктивность в общении, ответственность, профессионализм, готовность помогать коллегам).\n- Целевое обучение и развитие для улучшения показателей.\n- Рассмотреть горизонтальное перемещение для расширения опыта и ответственности.\n- План улучшения показателей с конкретными целями и сроками.\n\n## 4. КОНКРЕТНЫЕ ДЕЙСТВИЯ\n\nНемедленные шаги (0-3 месяца):\n- Провести встречу с Иваном для обсуждения результатов оценки и определения областей для улучшения.\n- Разработать план развития с конкретными целями.\n\nСреднесрочные действия (3-12 месяцев):\n- Предоставить Ивану целевое обучение и возможности для развития.\n- Оценить прогресс и скорректировать план развития.\n\nДолгосрочная стратегия (12+ месяцев):\n- Оценить эффективность развития и принять решение о продвижении или изменении роли.\n- Рассмотреть включение в кадровый резерв.\n\n## 5. РЕКОМЕНДАЦИИ ПО ВОЗНАГРАЖДЕНИЮ\n\nРекомендуется умеренное увеличение компенсации, основанное на текущей эффективности и потенциале. Бонусы и признание достижений могут быть использованы для мотивации. Нематериальная мотивация, такая как дополнительные возможности для развития и горизонтальное перемещение, также может быть эффективной.	2025-11-02 14:21:42.172221	f	2025-11-02 14:21:42.172221	\N
9	9	7	\N	## 1. ОБЩАЯ ОЦЕНКА И ВЫВОДЫ\n\nИван Иванов, занимающий должность employee, прошел оценку, результаты которой показывают смешанную картину. Самооценка сотрудника составляет 9.33/10, в то время как оценка его непосредственного руководителя, Кирилла Менеджерова, равна 8.0/10. Оценка коллег в рамках 360° обратной связи составила 6.4/10. Итоговый балл - 13.43/10. \n\nКлючевые выводы из этих данных указывают на то, что, хотя Иван Иванов высоко оценивает свою собственную результативность, его руководитель и коллеги видят его эффективность на среднем уровне. Это несоответствие требует внимания и обсуждения.\n\n## 2. АНАЛИЗ ПОТЕНЦИАЛА\n\nПозиция Ивана Иванова в 9-Box матрице определена как "Средний результат / Средний потенциал" с оценкой потенциала 6.0/10 и оценкой результативности 8.0/10. Готовность к продвижению оценивается как "Через 1-2 года". \n\nЭто говорит о том, что, хотя Иван Иванов показывает удовлетворительные результаты, его потенциал для роста и развития видится на среднем уровне. Важно сосредоточиться на улучшении его навыков и расширении зоны ответственности для более полной реализации его возможностей.\n\n## 3. СТРАТЕГИЧЕСКИЕ РЕКОМЕНДАЦИИ\n\nУчитывая среднюю оценку потенциала и результативности, рекомендуется сосредоточиться на развитии Ивана Иванова в рамках его текущей роли, с постепенным увеличением ответственности.\n\n- **Области для укрепления навыков**: Особое внимание следует уделить улучшению коммуникативных навыков и навыков командной работы, учитывая отзывы коллег.\n- **Целевое обучение и развитие**: Рекомендуется пройти курсы по развитию профессиональных и личных качеств, улучшению конструктивности в общении и повышению ответственности.\n- **Горизонтальное перемещение**: Рассмотреть возможность горизонтального перемещения для расширения опыта и зоны ответственности.\n- **План улучшения показателей**: Установить конкретные цели и метрики для улучшения эффективности и отслеживать прогресс.\n\n## 4. КОНКРЕТНЫЕ ДЕЙСТВИЯ\n\n### Немедленные шаги (0-3 месяца)\n- Провести встречу с Иваном Ивановым для обсуждения результатов оценки и определения областей для улучшения.\n- Составить индивидуальный план развития.\n\n### Среднесрочные действия (3-12 месяцев)\n- Предоставить Ивану Иванову возможности для обучения и развития.\n- Регулярно отслеживать прогресс и корректировать план развития по мере необходимости.\n\n### Долгосрочная стратегия (12+ месяцев)\n- Оценить эффективность реализованного плана развития.\n- Рассмотреть возможность продвижения или расширения зоны ответственности.\n\n## 5. РЕКОМЕНДАЦИИ ПО ВОЗНАГРАЖДЕНИЮ\n\n- **Предложения по корректировке компенсации**: Учитывая среднюю результативность, рекомендуется сохранение текущего уровня компенсации с возможностью увеличения при достижении конкретных целей.\n- **Бонусы и признание достижений**: Ввести систему бонусов за достижение определенных метрик и публично признавать достижения Ивана Иванова для нематериальной мотивации.\n\nЭти рекомендации направлены на сбалансированное развитие Ивана Иванова, удовлетворение его потребностей в росте и улучшение его вклада в достижение бизнес-целей компании.	2025-11-02 14:32:44.870815	f	2025-11-02 14:32:44.870815	13
10	13	8	3	## 1. ОБЩАЯ ОЦЕНКА И ВЫВОДЫ\n\nАнализ результатов оценки Дмитрия Смирнова показывает неоднозначную картину. С одной стороны, оценка коллег (9.2/10) и отдельные отзывы указывают на сильные профессиональные качества и良好ое взаимодействие в коллективе. С другой стороны, оценка непосредственного руководителя (0.0/10) и самооценка (6.0/10) демонстрируют значительные расхождения. \n\n## 2. АНАЛИЗ ПОТЕНЦИАЛА\n\nПозиция Дмитрия в 9-Box матрице классифицируется как "Средний результат / Средний потенциал". Оценка потенциала (8.0/10) и готовность к продвижению (1-2 года) указывают на наличие перспектив для роста, но также подчеркивают необходимость целенаправленной работы по развитию.\n\n## 3. СТРАТЕГИЧЕСКИЕ РЕКОМЕНДАЦИИ\n\n### ДЛЯ СОТРУДНИКОВ С ПОТЕНЦИАЛОМ, СООТВЕТСТВУЮЩИМ ТРЕБОВАНИЯМ:\n\n1. **Участие в стратегических проектах**: Включить Дмитрия в ключевые проекты для повышения видимости и значимости его вклада.\n2. **Развитие мягких навыков**: Организовать тренинги по улучшению коммуникационных и управленческих навыков.\n3. **Менторство и коучинг**: Назначить наставника для поддержки в профессиональном росте.\n4. **Расширение ответственности**: Постепенно увеличивать зону ответственности для развития лидерских качеств.\n\n## 4. КОНКРЕТНЫЕ ДЕЙСТВИЯ\n\n### КРАТКОСРОЧНЫЕ (0-3 МЕСЯЦА):\n- Провести встречу с Дмитрием для обсуждения результатов оценки и согласования плана развития.\n- Разработать индивидуальный план развития.\n\n### СРЕДНЕСРОЧНЫЕ (3-12 МЕСЯЦЕВ):\n- Включить Дмитрия в ключевые проекты.\n- Организовать тренинги и workshops.\n\n### ДОЛГОСРОЧНЫЕ (БОЛЕЕ 12 МЕСЯЦЕВ):\n- Оценить прогресс и скорректировать план развития.\n- Рассмотреть возможность повышения или ротации.\n\n## 5. РЕКОМЕНДАЦИИ ПО ВОЗНАГРАЖДЕНИЮ\n\n1. **Корректировка компенсации**: Рассмотреть возможность повышения зарплаты или предоставления дополнительных льгот.\n2. **Бонусы и признание**: Ввести систему бонусов за достижение конкретных целей.\n3. **Нематериальная мотивация**: Организовать признание достижений Дмитрия в коллективе.\n\nЭти рекомендации направлены на развитие потенциала Дмитрия, улучшение его вклада в достижение стратегических целей компании и повышение удовлетворенности работой.	2025-11-02 17:18:59.146741	f	2025-11-02 17:18:59.146741	\N
11	13	8	\N	## 1. ОБЩАЯ ОЦЕНКА И ВЫВОДЫ\n\nАнализ результатов оценки Дмитрия Смирнова показывает неоднозначную картину. С одной стороны, оценка коллег (9.2/10) и отдельные отзывы указывают на сильные профессиональные качества и良好ое взаимодействие в коллективе. С другой стороны, оценка непосредственного руководителя (0.0/10) и самооценка (6.0/10) демонстрируют значительные расхождения. \n\n## 2. АНАЛИЗ ПОТЕНЦИАЛА\n\nПозиция Дмитрия в 9-Box матрице классифицируется как "Средний результат / Средний потенциал". Оценка потенциала (8.0/10) и готовность к продвижению (1-2 года) указывают на наличие перспектив для роста, но также подчеркивают необходимость целенаправленной работы по развитию.\n\n## 3. СТРАТЕГИЧЕСКИЕ РЕКОМЕНДАЦИИ\n\n### ДЛЯ СОТРУДНИКОВ С ПОТЕНЦИАЛОМ, СООТВЕТСТВУЮЩИМ ТРЕБОВАНИЯМ:\n\n1. **Участие в стратегических проектах**: Включить Дмитрия в ключевые проекты для повышения видимости и значимости его вклада.\n2. **Развитие мягких навыков**: Организовать тренинги по улучшению коммуникационных и управленческих навыков.\n3. **Менторство и коучинг**: Назначить наставника для поддержки в профессиональном росте.\n4. **Расширение ответственности**: Постепенно увеличивать зону ответственности для развития лидерских качеств.\n\n## 4. КОНКРЕТНЫЕ ДЕЙСТВИЯ\n\n### КРАТКОСРОЧНЫЕ (0-3 МЕСЯЦА):\n- Провести встречу с Дмитрием для обсуждения результатов оценки и согласования плана развития.\n- Разработать индивидуальный план развития.\n\n### СРЕДНЕСРОЧНЫЕ (3-12 МЕСЯЦЕВ):\n- Включить Дмитрия в ключевые проекты.\n- Организовать тренинги и workshops.\n\n### ДОЛГОСРОЧНЫЕ (БОЛЕЕ 12 МЕСЯЦЕВ):\n- Оценить прогресс и скорректировать план развития.\n- Рассмотреть возможность повышения или ротации.\n\n## 5. РЕКОМЕНДАЦИИ ПО ВОЗНАГРАЖДЕНИЮ\n\n1. **Корректировка компенсации**: Рассмотреть возможность повышения зарплаты или предоставления дополнительных льгот.\n2. **Бонусы и признание**: Ввести систему бонусов за достижение конкретных целей.\n3. **Нематериальная мотивация**: Организовать признание достижений Дмитрия в коллективе.\n\nЭти рекомендации направлены на развитие потенциала Дмитрия, улучшение его вклада в достижение стратегических целей компании и повышение удовлетворенности работой.	2025-11-02 17:19:03.882142	f	2025-11-02 17:19:03.878499	27
\.


--
-- TOC entry 3903 (class 0 OID 23627123)
-- Dependencies: 244
-- Data for Name: manager_review_questions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.manager_review_questions (id, question_text, question_type, max_score, weight, is_active, display_order, created_at) FROM stdin;
2	Качество выполнения работы	scale_0_10	10	1.00	t	1	2025-10-24 15:03:39.483914
3	Соблюдение сроков	scale_0_10	10	1.00	t	2	2025-10-24 15:03:39.48846
4	Инициативность	scale_0_10	10	1.00	t	3	2025-10-24 15:03:39.49013
5	Коммуникабельность	scale_0_10	10	1.00	t	4	2025-10-24 15:03:39.491724
6	Способность работать в команде	scale_0_10	10	1.00	t	5	2025-10-24 15:03:39.493142
\.


--
-- TOC entry 3905 (class 0 OID 23627136)
-- Dependencies: 246
-- Data for Name: manager_reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.manager_reviews (id, employee_id, manager_id, task_id, cycle_id, question_id, answer_text, answer_score, feedback_summary, created_at) FROM stdin;
\.


--
-- TOC entry 3923 (class 0 OID 23627506)
-- Dependencies: 264
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, type, title, message, related_user_id, related_id, is_read, read_at, created_at) FROM stdin;
6	7	peer_reviews_completed	Все peer отзывы получены	Иван Иванов получил все peer отзывы для периода "Полугодие 1 - 2025 (Иван)". Можно переходить к оценке руководителя.	9	\N	f	\N	2025-10-30 19:48:44.120108
7	7	peer_reviews_completed	Все peer отзывы получены	Иван Иванов получил все peer отзывы для периода "Полугодие 1 - 2025 (Иван)". Можно переходить к оценке руководителя.	9	\N	f	\N	2025-10-30 19:48:57.151451
8	7	potential_assessment_ready	Готово к оценке потенциала	Иван Иванов готов к оценке потенциала	9	13	f	\N	2025-10-30 20:56:21.574251
9	9	potential_assessment_submitted	Оценка потенциала завершена	Руководитель завершил оценку вашего потенциала. Ожидайте расчета итогов.	\N	\N	f	\N	2025-10-31 14:23:02.094952
13	13	peer_feedback_request	Запрос на оценку	Анна Сидорова запросил у вас peer review для периода "Полугодие 1 - 2025 (Анна)"	10	41	f	\N	2025-10-31 14:30:16.412072
14	9	peer_feedback_request	Запрос на оценку	Анна Сидорова запросил у вас peer review для периода "Полугодие 1 - 2025 (Анна)"	10	42	f	\N	2025-10-31 14:30:23.630847
15	11	peer_feedback_request	Запрос на оценку	Анна Сидорова запросил у вас peer review для периода "Полугодие 1 - 2025 (Анна)"	10	43	f	\N	2025-10-31 14:30:31.488119
16	7	peer_reviews_completed	Все peer отзывы получены	Анна Сидорова получил все peer отзывы для периода "Полугодие 1 - 2025 (Анна)". Можно переходить к оценке руководителя.	10	\N	f	\N	2025-10-31 14:34:00.175765
17	7	potential_assessment_ready	Готово к оценке потенциала	Анна Сидорова готов к оценке потенциала	10	24	f	\N	2025-10-31 14:35:58.385497
18	10	potential_assessment_submitted	Оценка потенциала завершена	Руководитель завершил оценку вашего потенциала. Ожидайте расчета итогов.	7	\N	f	\N	2025-10-31 14:36:36.517149
19	9	calculation_completed	Калькуляция завершена	Ваша оценка была рассчитана. Посмотрите результаты на дашборде.	3	13	f	\N	2025-10-31 17:10:21.349235
20	7	calculation_completed	Калькуляция завершена у сотрудника	Калькуляция завершена для сотрудника (periodId: 13).	3	13	f	\N	2025-10-31 17:10:21.353544
21	10	calculation_completed	Калькуляция завершена	Ваша оценка была рассчитана. Посмотрите результаты на дашборде.	3	24	f	\N	2025-10-31 17:22:54.897692
22	7	calculation_completed	Калькуляция завершена у сотрудника	Калькуляция завершена для сотрудника (periodId: 24).	3	24	f	\N	2025-10-31 17:22:54.902741
1	7	early_pr_request	Запрос раннего Performance Review	Анна Сидорова запросил ранний Performance Review	10	15	t	2025-10-31 18:18:05.539514	2025-10-30 16:18:16.215975
2	10	early_pr_rejected	Запрос на ранний PR отклонен	Руководитель отклонил ваш запрос. Причина: Ты не готова!	\N	15	t	2025-10-31 18:18:05.539514	2025-10-30 17:58:30.747966
3	7	early_pr_request	Запрос раннего Performance Review	Иван Иванов запросил ранний Performance Review	9	13	t	2025-10-31 18:18:05.539514	2025-10-30 17:59:13.601519
4	3	early_pr_hr_approval	Требуется утверждение раннего PR	Руководитель утвердил ранний PR для Иван Иванов	9	13	t	2025-10-31 18:18:05.539514	2025-10-30 17:59:37.707326
5	9	early_pr_approved	Ранний PR утвержден	Ваш запрос утвержден. Приступайте к самооценке и запросам обратной связи.	\N	13	t	2025-10-31 18:18:05.539514	2025-10-30 18:09:07.855103
10	7	early_pr_request	Запрос раннего Performance Review	Анна Сидорова запросил ранний Performance Review	10	24	t	2025-10-31 18:18:05.539514	2025-10-31 14:26:40.662692
11	3	early_pr_hr_approval	Требуется утверждение раннего PR	Руководитель утвердил ранний PR для Анна Сидорова	10	24	t	2025-10-31 18:18:05.539514	2025-10-31 14:26:49.178626
12	10	early_pr_approved	Ранний PR утвержден	Ваш запрос утвержден. Приступайте к самооценке и запросам обратной связи.	\N	24	t	2025-10-31 18:18:05.539514	2025-10-31 14:26:56.73981
23	9	calculation_completed	Калькуляция завершена	Ваша оценка была рассчитана и рекомендации готовы. Теперь установите цели на следующий период (ID: 34).	3	13	f	\N	2025-11-02 14:32:44.931183
24	7	calculation_completed	Калькуляция завершена для сотрудника	Калькуляция и рекомендации готовы для вашего сотрудника (periodId: 13).	3	13	f	\N	2025-11-02 14:32:44.932557
25	8	early_pr_request	Запрос раннего Performance Review	Дмитрий Смирнов запросил ранний Performance Review	13	27	t	2025-11-02 17:09:12.155238	2025-11-02 17:07:47.706584
27	8	early_pr_request	Запрос раннего Performance Review	Дмитрий Смирнов запросил ранний Performance Review	13	27	t	2025-11-02 17:09:12.155238	2025-11-02 17:08:45.647081
26	13	early_pr_rejected	❌ Запрос на досрочный Performance Review отклонен	Руководитель отклонил ваш запрос на досрочное начало Performance Review.\n\nПричина: Слишком рано!\n\nВы можете подать новый запрос после устранения указанных замечаний.	\N	27	t	2025-11-02 17:09:12.155238	2025-11-02 17:08:28.15523
28	3	early_pr_hr_approval	Требуется утверждение раннего PR	Руководитель утвердил ранний PR для Дмитрий Смирнов	13	27	t	2025-11-02 17:09:12.155238	2025-11-02 17:08:57.490817
29	13	early_pr_approved	Ранний PR утвержден	Ваш запрос утвержден. Приступайте к самооценке и запросам обратной связи.	\N	27	t	2025-11-02 17:09:12.155238	2025-11-02 17:09:12.153317
30	9	peer_feedback_request	Запрос на оценку	Дмитрий Смирнов запросил у вас peer review для периода "Полугодие 1 - 2025 (Дмитрий)"	13	44	f	\N	2025-11-02 17:10:41.473177
31	11	peer_feedback_request	Запрос на оценку	Дмитрий Смирнов запросил у вас peer review для периода "Полугодие 1 - 2025 (Дмитрий)"	13	45	f	\N	2025-11-02 17:10:55.565445
32	10	peer_feedback_request	Запрос на оценку	Дмитрий Смирнов запросил у вас peer review для периода "Полугодие 1 - 2025 (Дмитрий)"	13	46	f	\N	2025-11-02 17:11:13.123766
33	8	peer_reviews_completed	Все peer отзывы получены	Дмитрий Смирнов получил все peer отзывы для периода "Полугодие 1 - 2025 (Дмитрий)". Можно переходить к оценке руководителя.	13	\N	f	\N	2025-11-02 17:14:15.489944
34	8	potential_assessment_ready	Готово к оценке потенциала	Дмитрий Смирнов готов к оценке потенциала	13	27	f	\N	2025-11-02 17:16:29.58134
35	13	potential_assessment_submitted	Оценка потенциала завершена	Руководитель завершил оценку вашего потенциала. Ожидайте расчета итогов.	8	\N	f	\N	2025-11-02 17:17:22.47509
36	3	employee_ready_for_calculation	Сотрудник готов к калькуляции	Дмитрий Смирнов готов(а) к калькуляции.	13	1	f	\N	2025-11-02 17:17:22.48158
37	13	calculation_completed	Калькуляция завершена	Ваша оценка была рассчитана и рекомендации готовы. Теперь установите цели на следующий период (ID: 35).	3	27	f	\N	2025-11-02 17:19:03.939534
38	8	calculation_completed	Калькуляция завершена для сотрудника	Калькуляция и рекомендации готовы для вашего сотрудника (periodId: 27).	3	27	f	\N	2025-11-02 17:19:03.94127
\.


--
-- TOC entry 3915 (class 0 OID 23627322)
-- Dependencies: 256
-- Data for Name: peer_feedback_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.peer_feedback_requests (id, requester_id, reviewer_id, status, message, created_at, completed_at, period_id) FROM stdin;
8	9	10	completed	\N	2025-10-30 15:26:44.154109	2024-12-15 00:00:00	16
9	9	11	completed	\N	2025-10-30 15:26:44.154109	2024-12-15 00:00:00	17
10	9	12	completed	\N	2025-10-30 15:26:44.154109	2024-12-15 00:00:00	19
40	9	10	completed	\N	2025-10-30 19:05:01.919311	2025-10-30 19:09:50.730656	13
39	9	8	completed	\N	2025-10-30 18:42:16.909825	2025-10-30 19:40:29.558032	13
38	9	13	completed	Привет! Оцени меня пожалуйста, мы с тобой работали вместе над проектом Wink PR	2025-10-30 18:41:28.33873	2025-10-30 19:41:30.27251	13
42	10	9	completed	\N	2025-10-31 14:30:23.627855	2025-10-31 14:32:08.220863	24
43	10	11	completed	\N	2025-10-31 14:30:31.484679	2025-10-31 14:33:11.333413	24
41	10	13	completed	\N	2025-10-31 14:30:16.403974	2025-10-31 14:34:00.171222	24
46	13	10	completed	Оцени пожалуйста!	2025-11-02 17:11:13.11969	2025-11-02 17:12:19.704962	27
44	13	9	completed	Привет! Мы с тобой работали вместе! Оцени пожалуйста!	2025-11-02 17:10:41.468302	2025-11-02 17:13:06.086436	27
45	13	11	completed	\N	2025-11-02 17:10:55.560898	2025-11-02 17:14:15.484977	27
\.


--
-- TOC entry 3917 (class 0 OID 23627350)
-- Dependencies: 258
-- Data for Name: peer_feedbacks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.peer_feedbacks (id, request_id, requester_id, reviewer_id, created_at, updated_at, result_achievement_rating, personal_qualities_comment, interaction_quality_rating, improvement_suggestions, period_id) FROM stdin;
5	40	9	10	2025-10-30 19:09:50.721469	2025-10-30 19:09:50.721469	5	Упорство и наглость	0	Быть внимательнее к коллегам. Ведет себя как царь!	13
6	39	9	8	2025-10-30 19:40:29.551655	2025-10-30 19:40:29.551655	7	Все нормально	7	Улучшить коммуникативные  навыки	13
7	38	9	13	2025-10-30 19:41:30.265242	2025-10-30 19:41:30.265242	10	Всегда четко выполняет обязанности	5	 Иногда грубит во время горящих дедлайнов	13
8	42	10	9	2025-10-31 14:32:08.213877	2025-10-31 14:32:08.213877	9	Анна достигла 76% покрытия из запланированных 80%. Написала 127 unit-тестов и 34 integration-теста для всех критичных модулей. Результат близок к целевому показателю и превосходит начальное покрытие. Задача выполнена качественно и в сроки.	10	На следующий период рекомендуется начинать писать тесты параллельно с разработкой, а не по завершении кода. Было бы полезно активнее участвовать в планировании и оценке временных затрат на тестирование уже в спринт-планировании. Также хорошо бы провести воркшоп для команды по best practices в тестировании.	24
9	43	10	11	2025-10-31 14:33:11.325469	2025-10-31 14:33:11.325469	4	Анна имеет хорошие технические навыки, но им не хватает системности. Работает волнами — то берется за задачу с полной отдачей, то теряет фокус. Не очень внимательна к деталям — тесты часто содержат copy-paste код без учета специфики модулей. Доверчива в общении, иногда берет обещания, которые не может выполнить.	2	Необходимо развивать дисциплину и ответственность за качество. Рекомендуется более тщательно анализировать требования перед написанием тестов. Важно улучшить навыки коммуникации — вовремя сообщать об изменениях планов и потенциальных рисках. Стоит работать над способностью принимать конструктивную критику без личных обид.	24
10	41	10	13	2025-10-31 14:34:00.164228	2025-10-31 14:34:00.164228	10	Анна — образец профессионализма и внимательности. Обладает редким сочетанием технического мастерства и стратегического мышления. Её инициативность проявилась в проактивном внедрении CI/CD автоматизации, что ускорило работу всей команды. Настойчивость и целеустремленность позволяют ей не соглашаться на компромиссы по качеству. Это сотрудник, на которого можно полностью положиться.\n	10	Анна — образцовый командный игрок. Всегда открыта к диалогу, готова помочь коллегам разбираться в новых инструментах и подходах. Щедро делится своим опытом, ведёт knowledge-sharing сессии. Коммуникирует статус проекта прозрачно и своевременно. Её позитивный настрой и конструктивный подход вдохновляют всю команду.	24
11	46	13	10	2025-11-02 17:12:19.701309	2025-11-02 17:12:19.701309	7	Упорство, лидерские качества!	3	Иногда не вежливо общается	27
12	44	13	9	2025-11-02 17:13:06.079618	2025-11-02 17:13:06.079618	7	Отличная экспертиза!	10	Отличная коммуникация! Всегда на связи	27
13	45	13	11	2025-11-02 17:14:15.476772	2025-11-02 17:14:15.476772	7	Высокая степень экспертизы	10	Улучшить степень коммуникации с коллегами	27
\.


--
-- TOC entry 3899 (class 0 OID 23627071)
-- Dependencies: 240
-- Data for Name: peer_review_questions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.peer_review_questions (id, question_text, question_type, max_score, weight, is_active, display_order, created_at) FROM stdin;
1	Эффективность совместной работы	scale_0_10	10	1.00	t	1	2025-10-24 15:03:39.498234
2	Готовность помогать коллегам	scale_0_10	10	1.00	t	2	2025-10-24 15:03:39.500192
3	Профессионализм	scale_0_10	10	1.00	t	3	2025-10-24 15:03:39.502142
4	Ответственность	scale_0_10	10	1.00	t	4	2025-10-24 15:03:39.504041
5	Конструктивность в общении	scale_0_10	10	1.00	t	5	2025-10-24 15:03:39.505534
\.


--
-- TOC entry 3901 (class 0 OID 23627084)
-- Dependencies: 242
-- Data for Name: peer_reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.peer_reviews (id, employee_id, respondent_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) FROM stdin;
12	7	11	2	2	1	Оценка коллеги по вопросу 1	3	2025-10-24 15:04:02.261497
13	7	11	2	2	2	Оценка коллеги по вопросу 2	4	2025-10-24 15:04:02.262988
14	7	11	2	2	3	Оценка коллеги по вопросу 3	4	2025-10-24 15:04:02.264462
15	7	11	2	2	4	Оценка коллеги по вопросу 4	5	2025-10-24 15:04:02.265411
16	7	11	2	2	5	Оценка коллеги по вопросу 5	3	2025-10-24 15:04:02.266446
17	8	7	2	2	1	Оценка коллеги по вопросу 1	5	2025-10-24 15:04:02.273174
18	8	7	2	2	2	Оценка коллеги по вопросу 2	3	2025-10-24 15:04:02.274194
19	8	7	2	2	3	Оценка коллеги по вопросу 3	3	2025-10-24 15:04:02.275541
20	8	7	2	2	4	Оценка коллеги по вопросу 4	4	2025-10-24 15:04:02.276859
21	8	7	2	2	5	Оценка коллеги по вопросу 5	5	2025-10-24 15:04:02.278788
22	9	10	3	2	1	Оценка коллеги по вопросу 1	4	2025-10-24 15:04:02.29642
23	9	10	3	2	2	Оценка коллеги по вопросу 2	3	2025-10-24 15:04:02.298119
24	9	10	3	2	3	Оценка коллеги по вопросу 3	3	2025-10-24 15:04:02.299163
25	9	10	3	2	4	Оценка коллеги по вопросу 4	3	2025-10-24 15:04:02.300219
26	9	10	3	2	5	Оценка коллеги по вопросу 5	3	2025-10-24 15:04:02.300997
32	11	7	1	2	1	Оценка коллеги по вопросу 1	4	2025-10-24 15:04:02.337641
33	11	7	1	2	2	Оценка коллеги по вопросу 2	5	2025-10-24 15:04:02.339383
34	11	7	1	2	3	Оценка коллеги по вопросу 3	4	2025-10-24 15:04:02.340893
35	11	7	1	2	4	Оценка коллеги по вопросу 4	3	2025-10-24 15:04:02.34244
36	11	7	1	2	5	Оценка коллеги по вопросу 5	3	2025-10-24 15:04:02.343455
42	13	10	3	2	1	Оценка коллеги по вопросу 1	5	2025-10-24 15:04:02.394089
43	13	10	3	2	2	Оценка коллеги по вопросу 2	5	2025-10-24 15:04:02.395773
44	13	10	3	2	3	Оценка коллеги по вопросу 3	5	2025-10-24 15:04:02.397255
45	13	10	3	2	4	Оценка коллеги по вопросу 4	3	2025-10-24 15:04:02.398783
46	13	10	3	2	5	Оценка коллеги по вопросу 5	5	2025-10-24 15:04:02.400627
\.


--
-- TOC entry 3929 (class 0 OID 23627556)
-- Dependencies: 270
-- Data for Name: performance_review_status; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.performance_review_status (id, user_id, period_id, status, early_request_date, early_request_comment, manager_approved_date, manager_approved_by, manager_approval_comment, hr_approved_date, hr_approved_by, hr_approval_comment, self_assessment_date, peer_feedback_completed_date, manager_evaluation_date, potential_assessment_date, completed_date, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3935 (class 0 OID 23627689)
-- Dependencies: 276
-- Data for Name: potential_assessments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.potential_assessments (id, employee_id, manager_id, cycle_id, prof_responsibility, prof_result_oriented, prof_proactivity, prof_open_mindset, prof_team_player, professional_comment, pers_took_responsibility, pers_transparent_communication, pers_shared_info, pers_organized_work, personal_comment, had_motivation_one_on_one, knows_miscommunication_cases, development_desire, is_successor, successor_ready_timing, turnover_risk, ole_priority_1, ole_priority_2, performance_raw_score, performance_final_score, potential_raw_score, potential_final_score, created_at, updated_at) FROM stdin;
13	12	7	2	t	t	t	f	t	Оценка потенциала на основе наблюдений и достижений	t	f	t	t	Демонстрирует стабильные результаты и готовность к развитию	t	f	Среднее	f	Через 1-2 года	2	Развитие технических навыков	Улучшение коммуникаций	5	5	5	5	2025-10-31 19:10:49.8902	2025-10-31 19:10:49.8902
14	13	7	2	f	f	f	f	f	Оценка потенциала на основе наблюдений и достижений	f	f	f	f	Демонстрирует стабильные результаты и готовность к развитию	t	t	Низкое	f	Через 2-3 года	3	Развитие технических навыков	Улучшение коммуникаций	3	3	3	3	2025-10-31 19:10:49.89238	2025-10-31 19:10:49.89238
1	9	7	1	t	t	t	t	f		f	t	f	f		f	f	proactive	f	1-2_years	6	Не понятно что тут писать 		6	2	6	6	2025-10-30 21:25:12.919566	2025-10-30 21:46:39.169038
2	10	7	1	t	t	t	t	t		t	f	f	t		f	t	proactive	t	1-2_years	2			5	2	10	10	2025-10-31 14:36:36.504821	2025-10-31 14:36:36.504821
9	7	7	2	t	t	t	f	t	Оценка потенциала на основе наблюдений и достижений	t	f	t	t	Демонстрирует стабильные результаты и готовность к развитию	t	f	Среднее	f	Через 1-2 года	2	Развитие технических навыков	Улучшение коммуникаций	6	6	5	5	2025-10-31 19:10:49.878852	2025-10-31 19:10:49.878852
10	9	7	2	t	t	t	t	t	Оценка потенциала на основе наблюдений и достижений	t	t	t	t	Демонстрирует стабильные результаты и готовность к развитию	t	f	Высокое	f	Через 1-2 года	1	Развитие технических навыков	Улучшение коммуникаций	8	8	6	6	2025-10-31 19:10:49.883399	2025-10-31 19:10:49.883399
11	10	7	2	t	t	t	t	t	Оценка потенциала на основе наблюдений и достижений	t	t	t	t	Демонстрирует стабильные результаты и готовность к развитию	t	f	Высокое	t	В течение года	1	Развитие технических навыков	Улучшение коммуникаций	9	9	7	7	2025-10-31 19:10:49.885699	2025-10-31 19:10:49.885699
12	11	7	2	t	t	t	t	t	Оценка потенциала на основе наблюдений и достижений	t	t	t	t	Демонстрирует стабильные результаты и готовность к развитию	t	f	Высокое	f	Через 1-2 года	1	Развитие технических навыков	Улучшение коммуникаций	7	7	6	6	2025-10-31 19:10:49.887858	2025-10-31 19:10:49.887858
15	13	8	1	t	t	f	f	t		t	t	f	f		t	t	proactive	t	1-2_years	4			3	0	8	8	2025-11-02 17:17:22.463251	2025-11-02 17:17:22.463251
\.


--
-- TOC entry 3909 (class 0 OID 23627230)
-- Dependencies: 250
-- Data for Name: potential_detail_answers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.potential_detail_answers (id, assessment_id, question_id, answer_boolean, answer_integer, answer_text, created_at) FROM stdin;
\.


--
-- TOC entry 3907 (class 0 OID 23627217)
-- Dependencies: 248
-- Data for Name: potential_detail_questions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.potential_detail_questions (id, question_number, question_text, answer_type, weight, is_active, display_order, created_at) FROM stdin;
\.


--
-- TOC entry 3913 (class 0 OID 23627283)
-- Dependencies: 254
-- Data for Name: recommendation_triggers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.recommendation_triggers (id, trigger_word, recommendation_text, category, is_active, created_at) FROM stdin;
\.


--
-- TOC entry 3871 (class 0 OID 23626776)
-- Dependencies: 212
-- Data for Name: review_cycles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.review_cycles (id, name, start_date, end_date, status, created_at) FROM stdin;
1	Полугодие 1 - 2025	2025-01-01	2025-06-30	active	2025-10-24 09:26:23.107702
2	Полугодие 2 - 2025	2025-07-01	2025-12-31	active	2025-10-24 09:29:58.134448
\.


--
-- TOC entry 3925 (class 0 OID 23627531)
-- Dependencies: 266
-- Data for Name: review_periods; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.review_periods (id, name, start_date, end_date, is_active, created_at) FROM stdin;
6	Полугодие 1 - 2025	2025-01-01	2025-06-30	f	2025-10-24 18:22:22.527265
7	Полугодие 2 - 2025	2025-07-01	2025-12-31	t	2025-10-24 18:22:22.527265
\.


--
-- TOC entry 3883 (class 0 OID 23626888)
-- Dependencies: 224
-- Data for Name: selected_respondents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.selected_respondents (id, employee_id, respondent_id, task_id, cycle_id, status, created_at) FROM stdin;
\.


--
-- TOC entry 3895 (class 0 OID 23627025)
-- Dependencies: 236
-- Data for Name: self_assessment_questions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.self_assessment_questions (id, question_text, question_type, options, max_score, weight, is_active, display_order, created_at) FROM stdin;
\.


--
-- TOC entry 3897 (class 0 OID 23627038)
-- Dependencies: 238
-- Data for Name: self_assessments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.self_assessments (id, user_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) FROM stdin;
121	7	1	2	1	\N	3	2025-10-24 13:26:55.110608
122	7	1	2	2	\N	4	2025-10-24 13:26:55.112161
123	7	1	2	3	\N	4	2025-10-24 13:26:55.113953
124	7	1	2	4	\N	3	2025-10-24 13:26:55.115051
125	7	1	2	5	\N	4	2025-10-24 13:26:55.115956
126	8	1	2	1	\N	4	2025-10-24 13:26:55.121498
127	8	1	2	2	\N	4	2025-10-24 13:26:55.122652
128	8	1	2	3	\N	5	2025-10-24 13:26:55.123983
129	8	1	2	4	\N	4	2025-10-24 13:26:55.124776
130	8	1	2	5	\N	5	2025-10-24 13:26:55.126164
131	9	1	2	1	\N	3	2025-10-24 13:26:55.128432
132	9	1	2	2	\N	3	2025-10-24 13:26:55.129761
133	9	1	2	3	\N	3	2025-10-24 13:26:55.130768
134	9	1	2	4	\N	5	2025-10-24 13:26:55.131964
135	9	1	2	5	\N	5	2025-10-24 13:26:55.132986
136	10	1	2	1	\N	4	2025-10-24 13:26:55.134976
137	10	1	2	2	\N	5	2025-10-24 13:26:55.135975
138	10	1	2	3	\N	5	2025-10-24 13:26:55.137034
139	10	1	2	4	\N	3	2025-10-24 13:26:55.138127
140	10	1	2	5	\N	4	2025-10-24 13:26:55.138865
141	11	1	2	1	\N	4	2025-10-24 13:26:55.140918
142	11	1	2	2	\N	3	2025-10-24 13:26:55.14258
143	11	1	2	3	\N	4	2025-10-24 13:26:55.144109
144	11	1	2	4	\N	4	2025-10-24 13:26:55.145378
145	11	1	2	5	\N	5	2025-10-24 13:26:55.146716
146	12	1	2	1	\N	3	2025-10-24 13:26:55.150047
147	12	1	2	2	\N	5	2025-10-24 13:26:55.151444
148	12	1	2	3	\N	5	2025-10-24 13:26:55.152561
149	12	1	2	4	\N	5	2025-10-24 13:26:55.153677
150	12	1	2	5	\N	4	2025-10-24 13:26:55.154845
153	9	1	1	1	Я успешно завершил все запланированные задачи. Реализовал новую функциональность для системы Performance Review, улучшил производительность на 30%.	8	2025-10-30 20:02:18.10424
154	9	1	1	2	Активно взаимодействовал с командой, проводил code review, помогал коллегам разбираться со сложными задачами.	7	2025-10-30 20:02:18.11338
155	9	1	1	3	Изучил новые технологии React и Node.js, применил их в проекте. Прошел курс по архитектуре приложений.	8	2025-10-30 20:02:18.115456
156	9	1	1	4	Хочу развиваться в направлении архитектуры систем, изучить микросервисы и cloud-технологии.	\N	2025-10-30 20:02:18.117852
157	13	1	2	1	Выполняю задачи на среднем уровне	3	2025-10-31 20:07:36.751392
158	13	1	2	2	Выполняю задачи на среднем уровне	3	2025-10-31 20:07:36.759018
159	13	1	2	3	Выполняю задачи на среднем уровне	3	2025-10-31 20:07:36.761342
160	13	1	2	4	Выполняю задачи на среднем уровне	3	2025-10-31 20:07:36.76329
161	13	1	2	5	Выполняю задачи на среднем уровне	3	2025-10-31 20:07:36.765091
\.


--
-- TOC entry 3879 (class 0 OID 23626844)
-- Dependencies: 220
-- Data for Name: task_annotations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.task_annotations (id, task_id, annotation_text, source_sheet, created_at) FROM stdin;
\.


--
-- TOC entry 3875 (class 0 OID 23626801)
-- Dependencies: 216
-- Data for Name: task_leads; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.task_leads (id, task_id, user_id, full_name, role_title, notes, created_at) FROM stdin;
\.


--
-- TOC entry 3877 (class 0 OID 23626823)
-- Dependencies: 218
-- Data for Name: task_participants; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.task_participants (id, task_id, user_id, full_name, responsibility_area, is_internal, created_at) FROM stdin;
\.


--
-- TOC entry 3873 (class 0 OID 23626786)
-- Dependencies: 214
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tasks (id, legacy_number, name, description, department, owning_unit, status, notes, created_at, updated_at) FROM stdin;
1	\N	Интеграция Белтелекома	Разработка РИТ	Разработка	\N	active	\N	2025-10-24 09:26:34.352552	2025-10-24 09:26:34.352552
2	\N	Повышение конверсии	Оплата с карточки проекта	Продукт	\N	active	\N	2025-10-24 09:26:34.352552	2025-10-24 09:26:34.352552
3	\N	Главная на своих скрингридах	Обновление главной страницы	Дизайн	\N	active	\N	2025-10-24 09:26:34.352552	2025-10-24 09:26:34.352552
\.


--
-- TOC entry 3921 (class 0 OID 23627477)
-- Dependencies: 262
-- Data for Name: user_review_periods; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_review_periods (id, user_id, cycle_id, start_date, end_date, notification_sent, reminder_sent, status, created_at, updated_at) FROM stdin;
11	9	2	2025-10-20	2025-11-05	t	f	in_progress	2025-10-24 16:49:51.485634	2025-10-24 16:49:51.485634
12	10	2	2025-10-22	2025-11-10	t	f	in_progress	2025-10-24 16:49:51.495963	2025-10-24 16:49:51.495963
14	11	2	2025-10-01	2025-10-15	t	f	completed	2025-10-24 16:49:51.502161	2025-10-24 16:49:51.502161
15	12	2	2025-11-01	2025-11-15	f	f	pending	2025-10-24 16:49:51.506358	2025-10-24 16:49:51.506358
16	13	2	2025-11-05	2025-11-20	f	f	pending	2025-10-24 16:49:51.510367	2025-10-24 16:49:51.510367
18	7	2	2025-11-05	2025-11-20	f	f	pending	2025-10-24 16:49:51.516051	2025-10-24 16:49:51.516051
19	8	2	2025-11-10	2025-11-25	f	f	pending	2025-10-24 16:49:51.519562	2025-10-24 16:49:51.519562
\.


--
-- TOC entry 3869 (class 0 OID 23626753)
-- Dependencies: 210
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, password_hash, first_name, last_name, role, department, "position", manager_id, is_active, created_at, updated_at, hire_date) FROM stdin;
3	hr@wink.ru	$2a$10$0kGuHzfv0Y47H0QW5rFkfOTM1liYdLYSvj8/WXTMa1.BU4F8EC7im	Мария	Сидорова	hr	HR	HR Manager	\N	t	2025-10-24 09:26:11.811493	2025-10-24 09:26:11.811493	\N
4	admin@wink.ru	$2a$10$0kGuHzfv0Y47H0QW5rFkfOTM1liYdLYSvj8/WXTMa1.BU4F8EC7im	Алексей	Смирнов	admin	IT	System Administrator	\N	t	2025-10-24 09:26:11.811493	2025-10-24 09:26:11.811493	\N
7	manager1@wink.ru	$2a$10$0kGuHzfv0Y47H0QW5rFkfOTM1liYdLYSvj8/WXTMa1.BU4F8EC7im	Кирилл	Менеджеров	manager	Разработка	Team Lead	\N	t	2025-10-24 09:29:58.121543	2025-10-24 09:29:58.121543	\N
8	manager2@wink.ru	$2a$10$0kGuHzfv0Y47H0QW5rFkfOTM1liYdLYSvj8/WXTMa1.BU4F8EC7im	Мария	Петрова	manager	Маркетинг	Marketing Manager	\N	t	2025-10-24 09:29:58.121543	2025-10-24 09:29:58.121543	\N
9	emp1@wink.ru	$2a$10$0kGuHzfv0Y47H0QW5rFkfOTM1liYdLYSvj8/WXTMa1.BU4F8EC7im	Иван	Иванов	employee	Разработка	Senior Developer	7	t	2025-10-24 09:29:58.121543	2025-10-24 09:29:58.121543	2024-06-15
10	emp2@wink.ru	$2a$10$0kGuHzfv0Y47H0QW5rFkfOTM1liYdLYSvj8/WXTMa1.BU4F8EC7im	Анна	Сидорова	employee	Разработка	Middle Developer	7	t	2025-10-24 09:29:58.121543	2025-10-24 09:29:58.121543	2024-01-10
11	emp3@wink.ru	$2a$10$0kGuHzfv0Y47H0QW5rFkfOTM1liYdLYSvj8/WXTMa1.BU4F8EC7im	Петр	Петров	employee	Разработка	Junior Developer	7	t	2025-10-24 09:29:58.121543	2025-10-24 09:29:58.121543	2024-08-01
12	emp4@wink.ru	$2a$10$0kGuHzfv0Y47H0QW5rFkfOTM1liYdLYSvj8/WXTMa1.BU4F8EC7im	Ольга	Васильева	employee	Маркетинг	Marketing Specialist	8	t	2025-10-24 09:29:58.121543	2025-10-24 09:29:58.121543	2024-04-20
13	emp5@wink.ru	$2a$10$0kGuHzfv0Y47H0QW5rFkfOTM1liYdLYSvj8/WXTMa1.BU4F8EC7im	Дмитрий	Смирнов	employee	Маркетинг	Content Manager	8	t	2025-10-24 09:29:58.121543	2025-10-24 09:29:58.121543	2024-09-05
\.


--
-- TOC entry 3984 (class 0 OID 0)
-- Dependencies: 279
-- Name: company_triggers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.company_triggers_id_seq', 10, true);


--
-- TOC entry 3985 (class 0 OID 0)
-- Dependencies: 225
-- Name: employee_goals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.employee_goals_id_seq', 14, true);


--
-- TOC entry 3986 (class 0 OID 0)
-- Dependencies: 273
-- Name: employee_recommendations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.employee_recommendations_id_seq', 19, true);


--
-- TOC entry 3987 (class 0 OID 0)
-- Dependencies: 267
-- Name: employee_review_periods_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.employee_review_periods_id_seq', 35, true);


--
-- TOC entry 3988 (class 0 OID 0)
-- Dependencies: 277
-- Name: employee_summaries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.employee_summaries_id_seq', 1, true);


--
-- TOC entry 3989 (class 0 OID 0)
-- Dependencies: 221
-- Name: employee_tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.employee_tasks_id_seq', 1, false);


--
-- TOC entry 3990 (class 0 OID 0)
-- Dependencies: 251
-- Name: final_reviews_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.final_reviews_id_seq', 1, false);


--
-- TOC entry 3991 (class 0 OID 0)
-- Dependencies: 231
-- Name: form_sections_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.form_sections_id_seq', 1, false);


--
-- TOC entry 3992 (class 0 OID 0)
-- Dependencies: 233
-- Name: form_static_blocks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.form_static_blocks_id_seq', 1, false);


--
-- TOC entry 3993 (class 0 OID 0)
-- Dependencies: 229
-- Name: form_templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.form_templates_id_seq', 1, false);


--
-- TOC entry 3994 (class 0 OID 0)
-- Dependencies: 227
-- Name: goal_tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.goal_tasks_id_seq', 3, true);


--
-- TOC entry 3995 (class 0 OID 0)
-- Dependencies: 259
-- Name: manager_evaluations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.manager_evaluations_id_seq', 33, true);


--
-- TOC entry 3996 (class 0 OID 0)
-- Dependencies: 271
-- Name: manager_recommendations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.manager_recommendations_id_seq', 11, true);


--
-- TOC entry 3997 (class 0 OID 0)
-- Dependencies: 243
-- Name: manager_review_questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.manager_review_questions_id_seq', 6, true);


--
-- TOC entry 3998 (class 0 OID 0)
-- Dependencies: 245
-- Name: manager_reviews_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.manager_reviews_id_seq', 30, true);


--
-- TOC entry 3999 (class 0 OID 0)
-- Dependencies: 263
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_id_seq', 38, true);


--
-- TOC entry 4000 (class 0 OID 0)
-- Dependencies: 255
-- Name: peer_feedback_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.peer_feedback_requests_id_seq', 46, true);


--
-- TOC entry 4001 (class 0 OID 0)
-- Dependencies: 257
-- Name: peer_feedbacks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.peer_feedbacks_id_seq', 13, true);


--
-- TOC entry 4002 (class 0 OID 0)
-- Dependencies: 239
-- Name: peer_review_questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.peer_review_questions_id_seq', 5, true);


--
-- TOC entry 4003 (class 0 OID 0)
-- Dependencies: 241
-- Name: peer_reviews_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.peer_reviews_id_seq', 46, true);


--
-- TOC entry 4004 (class 0 OID 0)
-- Dependencies: 269
-- Name: performance_review_status_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.performance_review_status_id_seq', 12, true);


--
-- TOC entry 4005 (class 0 OID 0)
-- Dependencies: 275
-- Name: potential_assessments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.potential_assessments_id_seq', 15, true);


--
-- TOC entry 4006 (class 0 OID 0)
-- Dependencies: 249
-- Name: potential_detail_answers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.potential_detail_answers_id_seq', 1, false);


--
-- TOC entry 4007 (class 0 OID 0)
-- Dependencies: 247
-- Name: potential_detail_questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.potential_detail_questions_id_seq', 1, false);


--
-- TOC entry 4008 (class 0 OID 0)
-- Dependencies: 253
-- Name: recommendation_triggers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.recommendation_triggers_id_seq', 1, false);


--
-- TOC entry 4009 (class 0 OID 0)
-- Dependencies: 211
-- Name: review_cycles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.review_cycles_id_seq', 2, true);


--
-- TOC entry 4010 (class 0 OID 0)
-- Dependencies: 265
-- Name: review_periods_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.review_periods_id_seq', 7, true);


--
-- TOC entry 4011 (class 0 OID 0)
-- Dependencies: 223
-- Name: selected_respondents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.selected_respondents_id_seq', 1, false);


--
-- TOC entry 4012 (class 0 OID 0)
-- Dependencies: 235
-- Name: self_assessment_questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.self_assessment_questions_id_seq', 1, false);


--
-- TOC entry 4013 (class 0 OID 0)
-- Dependencies: 237
-- Name: self_assessments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.self_assessments_id_seq', 161, true);


--
-- TOC entry 4014 (class 0 OID 0)
-- Dependencies: 219
-- Name: task_annotations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.task_annotations_id_seq', 1, false);


--
-- TOC entry 4015 (class 0 OID 0)
-- Dependencies: 215
-- Name: task_leads_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.task_leads_id_seq', 1, false);


--
-- TOC entry 4016 (class 0 OID 0)
-- Dependencies: 217
-- Name: task_participants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.task_participants_id_seq', 1, false);


--
-- TOC entry 4017 (class 0 OID 0)
-- Dependencies: 213
-- Name: tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tasks_id_seq', 3, true);


--
-- TOC entry 4018 (class 0 OID 0)
-- Dependencies: 261
-- Name: user_review_periods_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_review_periods_id_seq', 19, true);


--
-- TOC entry 4019 (class 0 OID 0)
-- Dependencies: 209
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 13, true);


--
-- TOC entry 3655 (class 2606 OID 23627766)
-- Name: company_triggers company_triggers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_triggers
    ADD CONSTRAINT company_triggers_pkey PRIMARY KEY (id);


--
-- TOC entry 3657 (class 2606 OID 23627768)
-- Name: company_triggers company_triggers_word_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_triggers
    ADD CONSTRAINT company_triggers_word_key UNIQUE (word);


--
-- TOC entry 3542 (class 2606 OID 23626934)
-- Name: employee_goals employee_goals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_goals
    ADD CONSTRAINT employee_goals_pkey PRIMARY KEY (id);


--
-- TOC entry 3544 (class 2606 OID 23626936)
-- Name: employee_goals employee_goals_user_id_cycle_id_goal_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_goals
    ADD CONSTRAINT employee_goals_user_id_cycle_id_goal_number_key UNIQUE (user_id, cycle_id, goal_number);


--
-- TOC entry 3646 (class 2606 OID 23627649)
-- Name: employee_recommendations employee_recommendations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_recommendations
    ADD CONSTRAINT employee_recommendations_pkey PRIMARY KEY (id);


--
-- TOC entry 3631 (class 2606 OID 23627547)
-- Name: employee_review_periods employee_review_periods_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_review_periods
    ADD CONSTRAINT employee_review_periods_pkey PRIMARY KEY (id);


--
-- TOC entry 3633 (class 2606 OID 23627549)
-- Name: employee_review_periods employee_review_periods_user_id_start_date_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_review_periods
    ADD CONSTRAINT employee_review_periods_user_id_start_date_key UNIQUE (user_id, start_date);


--
-- TOC entry 3653 (class 2606 OID 23627740)
-- Name: employee_summaries employee_summaries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_summaries
    ADD CONSTRAINT employee_summaries_pkey PRIMARY KEY (id);


--
-- TOC entry 3530 (class 2606 OID 23626867)
-- Name: employee_tasks employee_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_tasks
    ADD CONSTRAINT employee_tasks_pkey PRIMARY KEY (id);


--
-- TOC entry 3532 (class 2606 OID 23626869)
-- Name: employee_tasks employee_tasks_user_id_cycle_id_task_order_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_tasks
    ADD CONSTRAINT employee_tasks_user_id_cycle_id_task_order_key UNIQUE (user_id, cycle_id, task_order);


--
-- TOC entry 3591 (class 2606 OID 23627269)
-- Name: final_reviews final_reviews_employee_id_cycle_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.final_reviews
    ADD CONSTRAINT final_reviews_employee_id_cycle_id_key UNIQUE (employee_id, cycle_id);


--
-- TOC entry 3593 (class 2606 OID 23627267)
-- Name: final_reviews final_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.final_reviews
    ADD CONSTRAINT final_reviews_pkey PRIMARY KEY (id);


--
-- TOC entry 3557 (class 2606 OID 23626997)
-- Name: form_sections form_sections_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.form_sections
    ADD CONSTRAINT form_sections_pkey PRIMARY KEY (id);


--
-- TOC entry 3559 (class 2606 OID 23627013)
-- Name: form_static_blocks form_static_blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.form_static_blocks
    ADD CONSTRAINT form_static_blocks_pkey PRIMARY KEY (id);


--
-- TOC entry 3553 (class 2606 OID 23626984)
-- Name: form_templates form_templates_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.form_templates
    ADD CONSTRAINT form_templates_code_key UNIQUE (code);


--
-- TOC entry 3555 (class 2606 OID 23626982)
-- Name: form_templates form_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.form_templates
    ADD CONSTRAINT form_templates_pkey PRIMARY KEY (id);


--
-- TOC entry 3548 (class 2606 OID 23626961)
-- Name: goal_tasks goal_tasks_goal_id_task_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goal_tasks
    ADD CONSTRAINT goal_tasks_goal_id_task_number_key UNIQUE (goal_id, task_number);


--
-- TOC entry 3550 (class 2606 OID 23626959)
-- Name: goal_tasks goal_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goal_tasks
    ADD CONSTRAINT goal_tasks_pkey PRIMARY KEY (id);


--
-- TOC entry 3611 (class 2606 OID 23627439)
-- Name: manager_evaluations manager_evaluations_employee_id_manager_id_cycle_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.manager_evaluations
    ADD CONSTRAINT manager_evaluations_employee_id_manager_id_cycle_id_key UNIQUE (employee_id, manager_id, cycle_id);


--
-- TOC entry 3613 (class 2606 OID 23627437)
-- Name: manager_evaluations manager_evaluations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.manager_evaluations
    ADD CONSTRAINT manager_evaluations_pkey PRIMARY KEY (id);


--
-- TOC entry 3644 (class 2606 OID 23627619)
-- Name: manager_recommendations manager_recommendations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.manager_recommendations
    ADD CONSTRAINT manager_recommendations_pkey PRIMARY KEY (id);


--
-- TOC entry 3576 (class 2606 OID 23627134)
-- Name: manager_review_questions manager_review_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.manager_review_questions
    ADD CONSTRAINT manager_review_questions_pkey PRIMARY KEY (id);


--
-- TOC entry 3580 (class 2606 OID 23627146)
-- Name: manager_reviews manager_reviews_employee_id_task_id_cycle_id_question_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.manager_reviews
    ADD CONSTRAINT manager_reviews_employee_id_task_id_cycle_id_question_id_key UNIQUE (employee_id, task_id, cycle_id, question_id);


--
-- TOC entry 3582 (class 2606 OID 23627144)
-- Name: manager_reviews manager_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.manager_reviews
    ADD CONSTRAINT manager_reviews_pkey PRIMARY KEY (id);


--
-- TOC entry 3627 (class 2606 OID 23627515)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- TOC entry 3600 (class 2606 OID 23627331)
-- Name: peer_feedback_requests peer_feedback_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.peer_feedback_requests
    ADD CONSTRAINT peer_feedback_requests_pkey PRIMARY KEY (id);


--
-- TOC entry 3603 (class 2606 OID 23627364)
-- Name: peer_feedbacks peer_feedbacks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.peer_feedbacks
    ADD CONSTRAINT peer_feedbacks_pkey PRIMARY KEY (id);


--
-- TOC entry 3568 (class 2606 OID 23627082)
-- Name: peer_review_questions peer_review_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.peer_review_questions
    ADD CONSTRAINT peer_review_questions_pkey PRIMARY KEY (id);


--
-- TOC entry 3572 (class 2606 OID 23627094)
-- Name: peer_reviews peer_reviews_employee_id_respondent_id_task_id_cycle_id_que_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.peer_reviews
    ADD CONSTRAINT peer_reviews_employee_id_respondent_id_task_id_cycle_id_que_key UNIQUE (employee_id, respondent_id, task_id, cycle_id, question_id);


--
-- TOC entry 3574 (class 2606 OID 23627092)
-- Name: peer_reviews peer_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.peer_reviews
    ADD CONSTRAINT peer_reviews_pkey PRIMARY KEY (id);


--
-- TOC entry 3638 (class 2606 OID 23627566)
-- Name: performance_review_status performance_review_status_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.performance_review_status
    ADD CONSTRAINT performance_review_status_pkey PRIMARY KEY (id);


--
-- TOC entry 3640 (class 2606 OID 23627568)
-- Name: performance_review_status performance_review_status_user_id_period_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.performance_review_status
    ADD CONSTRAINT performance_review_status_user_id_period_id_key UNIQUE (user_id, period_id);


--
-- TOC entry 3649 (class 2606 OID 23627712)
-- Name: potential_assessments potential_assessments_employee_id_cycle_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.potential_assessments
    ADD CONSTRAINT potential_assessments_employee_id_cycle_id_key UNIQUE (employee_id, cycle_id);


--
-- TOC entry 3651 (class 2606 OID 23627710)
-- Name: potential_assessments potential_assessments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.potential_assessments
    ADD CONSTRAINT potential_assessments_pkey PRIMARY KEY (id);


--
-- TOC entry 3587 (class 2606 OID 23627240)
-- Name: potential_detail_answers potential_detail_answers_assessment_id_question_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.potential_detail_answers
    ADD CONSTRAINT potential_detail_answers_assessment_id_question_id_key UNIQUE (assessment_id, question_id);


--
-- TOC entry 3589 (class 2606 OID 23627238)
-- Name: potential_detail_answers potential_detail_answers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.potential_detail_answers
    ADD CONSTRAINT potential_detail_answers_pkey PRIMARY KEY (id);


--
-- TOC entry 3584 (class 2606 OID 23627228)
-- Name: potential_detail_questions potential_detail_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.potential_detail_questions
    ADD CONSTRAINT potential_detail_questions_pkey PRIMARY KEY (id);


--
-- TOC entry 3598 (class 2606 OID 23627292)
-- Name: recommendation_triggers recommendation_triggers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recommendation_triggers
    ADD CONSTRAINT recommendation_triggers_pkey PRIMARY KEY (id);


--
-- TOC entry 3514 (class 2606 OID 23626784)
-- Name: review_cycles review_cycles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review_cycles
    ADD CONSTRAINT review_cycles_pkey PRIMARY KEY (id);


--
-- TOC entry 3629 (class 2606 OID 23627538)
-- Name: review_periods review_periods_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review_periods
    ADD CONSTRAINT review_periods_pkey PRIMARY KEY (id);


--
-- TOC entry 3538 (class 2606 OID 23626898)
-- Name: selected_respondents selected_respondents_employee_id_respondent_id_task_id_cycl_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.selected_respondents
    ADD CONSTRAINT selected_respondents_employee_id_respondent_id_task_id_cycl_key UNIQUE (employee_id, respondent_id, task_id, cycle_id);


--
-- TOC entry 3540 (class 2606 OID 23626896)
-- Name: selected_respondents selected_respondents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.selected_respondents
    ADD CONSTRAINT selected_respondents_pkey PRIMARY KEY (id);


--
-- TOC entry 3561 (class 2606 OID 23627036)
-- Name: self_assessment_questions self_assessment_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.self_assessment_questions
    ADD CONSTRAINT self_assessment_questions_pkey PRIMARY KEY (id);


--
-- TOC entry 3564 (class 2606 OID 23627046)
-- Name: self_assessments self_assessments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.self_assessments
    ADD CONSTRAINT self_assessments_pkey PRIMARY KEY (id);


--
-- TOC entry 3566 (class 2606 OID 23627048)
-- Name: self_assessments self_assessments_user_id_task_id_cycle_id_question_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.self_assessments
    ADD CONSTRAINT self_assessments_user_id_task_id_cycle_id_question_id_key UNIQUE (user_id, task_id, cycle_id, question_id);


--
-- TOC entry 3528 (class 2606 OID 23626853)
-- Name: task_annotations task_annotations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_annotations
    ADD CONSTRAINT task_annotations_pkey PRIMARY KEY (id);


--
-- TOC entry 3520 (class 2606 OID 23626809)
-- Name: task_leads task_leads_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_leads
    ADD CONSTRAINT task_leads_pkey PRIMARY KEY (id);


--
-- TOC entry 3522 (class 2606 OID 23626811)
-- Name: task_leads task_leads_task_id_full_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_leads
    ADD CONSTRAINT task_leads_task_id_full_name_key UNIQUE (task_id, full_name);


--
-- TOC entry 3524 (class 2606 OID 23626830)
-- Name: task_participants task_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_participants
    ADD CONSTRAINT task_participants_pkey PRIMARY KEY (id);


--
-- TOC entry 3526 (class 2606 OID 23626832)
-- Name: task_participants task_participants_task_id_full_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_participants
    ADD CONSTRAINT task_participants_task_id_full_name_key UNIQUE (task_id, full_name);


--
-- TOC entry 3518 (class 2606 OID 23626797)
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- TOC entry 3619 (class 2606 OID 23627488)
-- Name: user_review_periods user_review_periods_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_review_periods
    ADD CONSTRAINT user_review_periods_pkey PRIMARY KEY (id);


--
-- TOC entry 3621 (class 2606 OID 23627490)
-- Name: user_review_periods user_review_periods_user_id_cycle_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_review_periods
    ADD CONSTRAINT user_review_periods_user_id_cycle_id_key UNIQUE (user_id, cycle_id);


--
-- TOC entry 3510 (class 2606 OID 23626766)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 3512 (class 2606 OID 23626764)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3647 (class 1259 OID 23627660)
-- Name: idx_employee_recommendations_employee; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employee_recommendations_employee ON public.employee_recommendations USING btree (employee_id);


--
-- TOC entry 3533 (class 1259 OID 23626886)
-- Name: idx_employee_tasks_cycle; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employee_tasks_cycle ON public.employee_tasks USING btree (cycle_id);


--
-- TOC entry 3534 (class 1259 OID 23626885)
-- Name: idx_employee_tasks_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employee_tasks_user ON public.employee_tasks USING btree (user_id);


--
-- TOC entry 3594 (class 1259 OID 23627280)
-- Name: idx_final_review_employee; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_final_review_employee ON public.final_reviews USING btree (employee_id);


--
-- TOC entry 3595 (class 1259 OID 23627281)
-- Name: idx_final_review_rating; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_final_review_rating ON public.final_reviews USING btree (rating_category);


--
-- TOC entry 3551 (class 1259 OID 23626967)
-- Name: idx_goal_tasks_goal; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_goal_tasks_goal ON public.goal_tasks USING btree (goal_id);


--
-- TOC entry 3545 (class 1259 OID 23626948)
-- Name: idx_goals_cycle; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_goals_cycle ON public.employee_goals USING btree (cycle_id);


--
-- TOC entry 3546 (class 1259 OID 23626947)
-- Name: idx_goals_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_goals_user ON public.employee_goals USING btree (user_id);


--
-- TOC entry 3604 (class 1259 OID 23627457)
-- Name: idx_manager_eval_cycle; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_manager_eval_cycle ON public.manager_evaluations USING btree (cycle_id);


--
-- TOC entry 3605 (class 1259 OID 23627455)
-- Name: idx_manager_eval_employee; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_manager_eval_employee ON public.manager_evaluations USING btree (employee_id);


--
-- TOC entry 3606 (class 1259 OID 23627456)
-- Name: idx_manager_eval_manager; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_manager_eval_manager ON public.manager_evaluations USING btree (manager_id);


--
-- TOC entry 3607 (class 1259 OID 23627467)
-- Name: idx_manager_evaluations_cycle; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_manager_evaluations_cycle ON public.manager_evaluations USING btree (cycle_id);


--
-- TOC entry 3608 (class 1259 OID 23627465)
-- Name: idx_manager_evaluations_employee; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_manager_evaluations_employee ON public.manager_evaluations USING btree (employee_id);


--
-- TOC entry 3609 (class 1259 OID 23627466)
-- Name: idx_manager_evaluations_manager; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_manager_evaluations_manager ON public.manager_evaluations USING btree (manager_id);


--
-- TOC entry 3641 (class 1259 OID 23627637)
-- Name: idx_manager_recommendations_employee; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_manager_recommendations_employee ON public.manager_recommendations USING btree (employee_id);


--
-- TOC entry 3642 (class 1259 OID 23627636)
-- Name: idx_manager_recommendations_manager; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_manager_recommendations_manager ON public.manager_recommendations USING btree (manager_id);


--
-- TOC entry 3577 (class 1259 OID 23627172)
-- Name: idx_manager_review_employee; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_manager_review_employee ON public.manager_reviews USING btree (employee_id);


--
-- TOC entry 3578 (class 1259 OID 23627173)
-- Name: idx_manager_review_manager; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_manager_review_manager ON public.manager_reviews USING btree (manager_id);


--
-- TOC entry 3622 (class 1259 OID 23627528)
-- Name: idx_notifications_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (created_at);


--
-- TOC entry 3623 (class 1259 OID 23627527)
-- Name: idx_notifications_is_read; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_is_read ON public.notifications USING btree (is_read);


--
-- TOC entry 3624 (class 1259 OID 23627529)
-- Name: idx_notifications_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_type ON public.notifications USING btree (type);


--
-- TOC entry 3625 (class 1259 OID 23627526)
-- Name: idx_notifications_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);


--
-- TOC entry 3569 (class 1259 OID 23627120)
-- Name: idx_peer_review_employee; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_peer_review_employee ON public.peer_reviews USING btree (employee_id);


--
-- TOC entry 3570 (class 1259 OID 23627121)
-- Name: idx_peer_review_respondent; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_peer_review_respondent ON public.peer_reviews USING btree (respondent_id);


--
-- TOC entry 3585 (class 1259 OID 23627251)
-- Name: idx_potential_answers_assessment; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_potential_answers_assessment ON public.potential_detail_answers USING btree (assessment_id);


--
-- TOC entry 3634 (class 1259 OID 23627590)
-- Name: idx_pr_status_period_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pr_status_period_id ON public.performance_review_status USING btree (period_id);


--
-- TOC entry 3635 (class 1259 OID 23627591)
-- Name: idx_pr_status_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pr_status_status ON public.performance_review_status USING btree (status);


--
-- TOC entry 3636 (class 1259 OID 23627589)
-- Name: idx_pr_status_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pr_status_user_id ON public.performance_review_status USING btree (user_id);


--
-- TOC entry 3535 (class 1259 OID 23626919)
-- Name: idx_respondents_employee; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_respondents_employee ON public.selected_respondents USING btree (employee_id);


--
-- TOC entry 3536 (class 1259 OID 23626920)
-- Name: idx_respondents_respondent; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_respondents_respondent ON public.selected_respondents USING btree (respondent_id);


--
-- TOC entry 3562 (class 1259 OID 23627069)
-- Name: idx_self_assessment_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_self_assessment_user ON public.self_assessments USING btree (user_id);


--
-- TOC entry 3515 (class 1259 OID 23626798)
-- Name: idx_tasks_department; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tasks_department ON public.tasks USING btree (department);


--
-- TOC entry 3516 (class 1259 OID 23626799)
-- Name: idx_tasks_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tasks_status ON public.tasks USING btree (status);


--
-- TOC entry 3596 (class 1259 OID 23627293)
-- Name: idx_triggers_word; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_triggers_word ON public.recommendation_triggers USING btree (trigger_word);


--
-- TOC entry 3614 (class 1259 OID 23627502)
-- Name: idx_user_review_periods_cycle_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_review_periods_cycle_id ON public.user_review_periods USING btree (cycle_id);


--
-- TOC entry 3615 (class 1259 OID 23627503)
-- Name: idx_user_review_periods_dates; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_review_periods_dates ON public.user_review_periods USING btree (start_date, end_date);


--
-- TOC entry 3616 (class 1259 OID 23627504)
-- Name: idx_user_review_periods_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_review_periods_status ON public.user_review_periods USING btree (status);


--
-- TOC entry 3617 (class 1259 OID 23627501)
-- Name: idx_user_review_periods_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_review_periods_user_id ON public.user_review_periods USING btree (user_id);


--
-- TOC entry 3506 (class 1259 OID 23626774)
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- TOC entry 3507 (class 1259 OID 23626773)
-- Name: idx_users_manager; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_manager ON public.users USING btree (manager_id);


--
-- TOC entry 3508 (class 1259 OID 23626772)
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- TOC entry 3601 (class 1259 OID 23627678)
-- Name: peer_feedback_requests_unique_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX peer_feedback_requests_unique_idx ON public.peer_feedback_requests USING btree (requester_id, reviewer_id, period_id);


--
-- TOC entry 3671 (class 2606 OID 23626942)
-- Name: employee_goals employee_goals_cycle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_goals
    ADD CONSTRAINT employee_goals_cycle_id_fkey FOREIGN KEY (cycle_id) REFERENCES public.review_cycles(id);


--
-- TOC entry 3672 (class 2606 OID 23627751)
-- Name: employee_goals employee_goals_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_goals
    ADD CONSTRAINT employee_goals_period_id_fkey FOREIGN KEY (period_id) REFERENCES public.employee_review_periods(id) ON DELETE CASCADE;


--
-- TOC entry 3673 (class 2606 OID 23626937)
-- Name: employee_goals employee_goals_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_goals
    ADD CONSTRAINT employee_goals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 3721 (class 2606 OID 23627650)
-- Name: employee_recommendations employee_recommendations_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_recommendations
    ADD CONSTRAINT employee_recommendations_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3722 (class 2606 OID 23627655)
-- Name: employee_recommendations employee_recommendations_hr_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_recommendations
    ADD CONSTRAINT employee_recommendations_hr_id_fkey FOREIGN KEY (hr_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 3723 (class 2606 OID 23627776)
-- Name: employee_recommendations employee_recommendations_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_recommendations
    ADD CONSTRAINT employee_recommendations_period_id_fkey FOREIGN KEY (period_id) REFERENCES public.employee_review_periods(id) ON DELETE CASCADE;


--
-- TOC entry 3709 (class 2606 OID 23627680)
-- Name: employee_review_periods employee_review_periods_cycle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_review_periods
    ADD CONSTRAINT employee_review_periods_cycle_id_fkey FOREIGN KEY (cycle_id) REFERENCES public.review_cycles(id);


--
-- TOC entry 3710 (class 2606 OID 23627672)
-- Name: employee_review_periods employee_review_periods_hr_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_review_periods
    ADD CONSTRAINT employee_review_periods_hr_approved_by_fkey FOREIGN KEY (hr_approved_by) REFERENCES public.users(id);


--
-- TOC entry 3711 (class 2606 OID 23627667)
-- Name: employee_review_periods employee_review_periods_manager_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_review_periods
    ADD CONSTRAINT employee_review_periods_manager_approved_by_fkey FOREIGN KEY (manager_approved_by) REFERENCES public.users(id);


--
-- TOC entry 3712 (class 2606 OID 23627550)
-- Name: employee_review_periods employee_review_periods_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_review_periods
    ADD CONSTRAINT employee_review_periods_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3727 (class 2606 OID 23627746)
-- Name: employee_summaries employee_summaries_cycle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_summaries
    ADD CONSTRAINT employee_summaries_cycle_id_fkey FOREIGN KEY (cycle_id) REFERENCES public.review_cycles(id);


--
-- TOC entry 3728 (class 2606 OID 23627741)
-- Name: employee_summaries employee_summaries_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_summaries
    ADD CONSTRAINT employee_summaries_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.users(id);


--
-- TOC entry 3664 (class 2606 OID 23626880)
-- Name: employee_tasks employee_tasks_cycle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_tasks
    ADD CONSTRAINT employee_tasks_cycle_id_fkey FOREIGN KEY (cycle_id) REFERENCES public.review_cycles(id);


--
-- TOC entry 3665 (class 2606 OID 23626875)
-- Name: employee_tasks employee_tasks_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_tasks
    ADD CONSTRAINT employee_tasks_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id);


--
-- TOC entry 3666 (class 2606 OID 23626870)
-- Name: employee_tasks employee_tasks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_tasks
    ADD CONSTRAINT employee_tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 3692 (class 2606 OID 23627275)
-- Name: final_reviews final_reviews_cycle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.final_reviews
    ADD CONSTRAINT final_reviews_cycle_id_fkey FOREIGN KEY (cycle_id) REFERENCES public.review_cycles(id);


--
-- TOC entry 3693 (class 2606 OID 23627270)
-- Name: final_reviews final_reviews_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.final_reviews
    ADD CONSTRAINT final_reviews_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.users(id);


--
-- TOC entry 3675 (class 2606 OID 23626998)
-- Name: form_sections form_sections_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.form_sections
    ADD CONSTRAINT form_sections_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.form_templates(id) ON DELETE CASCADE;


--
-- TOC entry 3676 (class 2606 OID 23627019)
-- Name: form_static_blocks form_static_blocks_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.form_static_blocks
    ADD CONSTRAINT form_static_blocks_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.form_sections(id) ON DELETE CASCADE;


--
-- TOC entry 3677 (class 2606 OID 23627014)
-- Name: form_static_blocks form_static_blocks_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.form_static_blocks
    ADD CONSTRAINT form_static_blocks_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.form_templates(id) ON DELETE CASCADE;


--
-- TOC entry 3674 (class 2606 OID 23626962)
-- Name: goal_tasks goal_tasks_goal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goal_tasks
    ADD CONSTRAINT goal_tasks_goal_id_fkey FOREIGN KEY (goal_id) REFERENCES public.employee_goals(id) ON DELETE CASCADE;


--
-- TOC entry 3701 (class 2606 OID 23627450)
-- Name: manager_evaluations manager_evaluations_cycle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.manager_evaluations
    ADD CONSTRAINT manager_evaluations_cycle_id_fkey FOREIGN KEY (cycle_id) REFERENCES public.review_cycles(id) ON DELETE CASCADE;


--
-- TOC entry 3702 (class 2606 OID 23627440)
-- Name: manager_evaluations manager_evaluations_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.manager_evaluations
    ADD CONSTRAINT manager_evaluations_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3703 (class 2606 OID 23627471)
-- Name: manager_evaluations manager_evaluations_goal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.manager_evaluations
    ADD CONSTRAINT manager_evaluations_goal_id_fkey FOREIGN KEY (goal_id) REFERENCES public.employee_goals(id);


--
-- TOC entry 3704 (class 2606 OID 23627445)
-- Name: manager_evaluations manager_evaluations_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.manager_evaluations
    ADD CONSTRAINT manager_evaluations_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3717 (class 2606 OID 23627620)
-- Name: manager_recommendations manager_recommendations_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.manager_recommendations
    ADD CONSTRAINT manager_recommendations_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3718 (class 2606 OID 23627630)
-- Name: manager_recommendations manager_recommendations_hr_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.manager_recommendations
    ADD CONSTRAINT manager_recommendations_hr_id_fkey FOREIGN KEY (hr_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 3719 (class 2606 OID 23627625)
-- Name: manager_recommendations manager_recommendations_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.manager_recommendations
    ADD CONSTRAINT manager_recommendations_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3720 (class 2606 OID 23627769)
-- Name: manager_recommendations manager_recommendations_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.manager_recommendations
    ADD CONSTRAINT manager_recommendations_period_id_fkey FOREIGN KEY (period_id) REFERENCES public.employee_review_periods(id);


--
-- TOC entry 3686 (class 2606 OID 23627162)
-- Name: manager_reviews manager_reviews_cycle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.manager_reviews
    ADD CONSTRAINT manager_reviews_cycle_id_fkey FOREIGN KEY (cycle_id) REFERENCES public.review_cycles(id);


--
-- TOC entry 3687 (class 2606 OID 23627147)
-- Name: manager_reviews manager_reviews_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.manager_reviews
    ADD CONSTRAINT manager_reviews_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.users(id);


--
-- TOC entry 3688 (class 2606 OID 23627152)
-- Name: manager_reviews manager_reviews_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.manager_reviews
    ADD CONSTRAINT manager_reviews_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.users(id);


--
-- TOC entry 3689 (class 2606 OID 23627167)
-- Name: manager_reviews manager_reviews_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.manager_reviews
    ADD CONSTRAINT manager_reviews_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.manager_review_questions(id);


--
-- TOC entry 3690 (class 2606 OID 23627157)
-- Name: manager_reviews manager_reviews_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.manager_reviews
    ADD CONSTRAINT manager_reviews_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id);


--
-- TOC entry 3707 (class 2606 OID 23627521)
-- Name: notifications notifications_related_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_related_user_id_fkey FOREIGN KEY (related_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 3708 (class 2606 OID 23627516)
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3694 (class 2606 OID 23627598)
-- Name: peer_feedback_requests peer_feedback_requests_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.peer_feedback_requests
    ADD CONSTRAINT peer_feedback_requests_period_id_fkey FOREIGN KEY (period_id) REFERENCES public.employee_review_periods(id);


--
-- TOC entry 3695 (class 2606 OID 23627334)
-- Name: peer_feedback_requests peer_feedback_requests_requester_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.peer_feedback_requests
    ADD CONSTRAINT peer_feedback_requests_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3696 (class 2606 OID 23627339)
-- Name: peer_feedback_requests peer_feedback_requests_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.peer_feedback_requests
    ADD CONSTRAINT peer_feedback_requests_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3697 (class 2606 OID 23627603)
-- Name: peer_feedbacks peer_feedbacks_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.peer_feedbacks
    ADD CONSTRAINT peer_feedbacks_period_id_fkey FOREIGN KEY (period_id) REFERENCES public.employee_review_periods(id);


--
-- TOC entry 3698 (class 2606 OID 23627365)
-- Name: peer_feedbacks peer_feedbacks_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.peer_feedbacks
    ADD CONSTRAINT peer_feedbacks_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.peer_feedback_requests(id) ON DELETE CASCADE;


--
-- TOC entry 3699 (class 2606 OID 23627370)
-- Name: peer_feedbacks peer_feedbacks_requester_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.peer_feedbacks
    ADD CONSTRAINT peer_feedbacks_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3700 (class 2606 OID 23627375)
-- Name: peer_feedbacks peer_feedbacks_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.peer_feedbacks
    ADD CONSTRAINT peer_feedbacks_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3681 (class 2606 OID 23627110)
-- Name: peer_reviews peer_reviews_cycle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.peer_reviews
    ADD CONSTRAINT peer_reviews_cycle_id_fkey FOREIGN KEY (cycle_id) REFERENCES public.review_cycles(id);


--
-- TOC entry 3682 (class 2606 OID 23627095)
-- Name: peer_reviews peer_reviews_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.peer_reviews
    ADD CONSTRAINT peer_reviews_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.users(id);


--
-- TOC entry 3683 (class 2606 OID 23627115)
-- Name: peer_reviews peer_reviews_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.peer_reviews
    ADD CONSTRAINT peer_reviews_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.peer_review_questions(id);


--
-- TOC entry 3684 (class 2606 OID 23627100)
-- Name: peer_reviews peer_reviews_respondent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.peer_reviews
    ADD CONSTRAINT peer_reviews_respondent_id_fkey FOREIGN KEY (respondent_id) REFERENCES public.users(id);


--
-- TOC entry 3685 (class 2606 OID 23627105)
-- Name: peer_reviews peer_reviews_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.peer_reviews
    ADD CONSTRAINT peer_reviews_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id);


--
-- TOC entry 3713 (class 2606 OID 23627584)
-- Name: performance_review_status performance_review_status_hr_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.performance_review_status
    ADD CONSTRAINT performance_review_status_hr_approved_by_fkey FOREIGN KEY (hr_approved_by) REFERENCES public.users(id);


--
-- TOC entry 3714 (class 2606 OID 23627579)
-- Name: performance_review_status performance_review_status_manager_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.performance_review_status
    ADD CONSTRAINT performance_review_status_manager_approved_by_fkey FOREIGN KEY (manager_approved_by) REFERENCES public.users(id);


--
-- TOC entry 3715 (class 2606 OID 23627574)
-- Name: performance_review_status performance_review_status_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.performance_review_status
    ADD CONSTRAINT performance_review_status_period_id_fkey FOREIGN KEY (period_id) REFERENCES public.employee_review_periods(id) ON DELETE CASCADE;


--
-- TOC entry 3716 (class 2606 OID 23627569)
-- Name: performance_review_status performance_review_status_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.performance_review_status
    ADD CONSTRAINT performance_review_status_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3724 (class 2606 OID 23627723)
-- Name: potential_assessments potential_assessments_cycle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.potential_assessments
    ADD CONSTRAINT potential_assessments_cycle_id_fkey FOREIGN KEY (cycle_id) REFERENCES public.review_cycles(id);


--
-- TOC entry 3725 (class 2606 OID 23627713)
-- Name: potential_assessments potential_assessments_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.potential_assessments
    ADD CONSTRAINT potential_assessments_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.users(id);


--
-- TOC entry 3726 (class 2606 OID 23627718)
-- Name: potential_assessments potential_assessments_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.potential_assessments
    ADD CONSTRAINT potential_assessments_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.users(id);


--
-- TOC entry 3691 (class 2606 OID 23627246)
-- Name: potential_detail_answers potential_detail_answers_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.potential_detail_answers
    ADD CONSTRAINT potential_detail_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.potential_detail_questions(id);


--
-- TOC entry 3667 (class 2606 OID 23626914)
-- Name: selected_respondents selected_respondents_cycle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.selected_respondents
    ADD CONSTRAINT selected_respondents_cycle_id_fkey FOREIGN KEY (cycle_id) REFERENCES public.review_cycles(id);


--
-- TOC entry 3668 (class 2606 OID 23626899)
-- Name: selected_respondents selected_respondents_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.selected_respondents
    ADD CONSTRAINT selected_respondents_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.users(id);


--
-- TOC entry 3669 (class 2606 OID 23626904)
-- Name: selected_respondents selected_respondents_respondent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.selected_respondents
    ADD CONSTRAINT selected_respondents_respondent_id_fkey FOREIGN KEY (respondent_id) REFERENCES public.users(id);


--
-- TOC entry 3670 (class 2606 OID 23626909)
-- Name: selected_respondents selected_respondents_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.selected_respondents
    ADD CONSTRAINT selected_respondents_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id);


--
-- TOC entry 3678 (class 2606 OID 23627059)
-- Name: self_assessments self_assessments_cycle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.self_assessments
    ADD CONSTRAINT self_assessments_cycle_id_fkey FOREIGN KEY (cycle_id) REFERENCES public.review_cycles(id);


--
-- TOC entry 3679 (class 2606 OID 23627054)
-- Name: self_assessments self_assessments_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.self_assessments
    ADD CONSTRAINT self_assessments_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id);


--
-- TOC entry 3680 (class 2606 OID 23627049)
-- Name: self_assessments self_assessments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.self_assessments
    ADD CONSTRAINT self_assessments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 3663 (class 2606 OID 23626854)
-- Name: task_annotations task_annotations_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_annotations
    ADD CONSTRAINT task_annotations_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- TOC entry 3659 (class 2606 OID 23626812)
-- Name: task_leads task_leads_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_leads
    ADD CONSTRAINT task_leads_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- TOC entry 3660 (class 2606 OID 23626817)
-- Name: task_leads task_leads_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_leads
    ADD CONSTRAINT task_leads_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 3661 (class 2606 OID 23626833)
-- Name: task_participants task_participants_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_participants
    ADD CONSTRAINT task_participants_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- TOC entry 3662 (class 2606 OID 23626838)
-- Name: task_participants task_participants_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_participants
    ADD CONSTRAINT task_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 3705 (class 2606 OID 23627496)
-- Name: user_review_periods user_review_periods_cycle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_review_periods
    ADD CONSTRAINT user_review_periods_cycle_id_fkey FOREIGN KEY (cycle_id) REFERENCES public.review_cycles(id) ON DELETE CASCADE;


--
-- TOC entry 3706 (class 2606 OID 23627491)
-- Name: user_review_periods user_review_periods_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_review_periods
    ADD CONSTRAINT user_review_periods_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3658 (class 2606 OID 23626767)
-- Name: users users_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.users(id);


--
-- TOC entry 3947 (class 0 OID 0)
-- Dependencies: 4
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO PUBLIC;


-- Completed on 2025-11-02 17:34:27

--
-- PostgreSQL database dump complete
--

