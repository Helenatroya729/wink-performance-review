--
-- PostgreSQL database dump
--

-- Dumped from database version 14.1
-- Dumped by pg_dump version 17.4

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

DROP DATABASE IF EXISTS wink_performance_review;
--
-- Name: wink_performance_review; Type: DATABASE; Schema: -; Owner: -
--

CREATE DATABASE wink_performance_review WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'Russian_Russia.1251';


\connect wink_performance_review

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
-- Name: DATABASE wink_performance_review; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON DATABASE wink_performance_review IS 'База данных для системы оценки эффективности сотрудников WINK';


--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: company_triggers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.company_triggers (
    id integer NOT NULL,
    word character varying(255) NOT NULL,
    recommendation text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: company_triggers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.company_triggers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: company_triggers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.company_triggers_id_seq OWNED BY public.company_triggers.id;


--
-- Name: employee_goals; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: employee_goals_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.employee_goals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: employee_goals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.employee_goals_id_seq OWNED BY public.employee_goals.id;


--
-- Name: employee_recommendations; Type: TABLE; Schema: public; Owner: -
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
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: employee_recommendations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.employee_recommendations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: employee_recommendations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.employee_recommendations_id_seq OWNED BY public.employee_recommendations.id;


--
-- Name: employee_review_periods; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: employee_review_periods_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.employee_review_periods_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: employee_review_periods_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.employee_review_periods_id_seq OWNED BY public.employee_review_periods.id;


--
-- Name: employee_summaries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_summaries (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    cycle_id integer,
    summary_text text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: employee_summaries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.employee_summaries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: employee_summaries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.employee_summaries_id_seq OWNED BY public.employee_summaries.id;


--
-- Name: employee_tasks; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: employee_tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.employee_tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: employee_tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.employee_tasks_id_seq OWNED BY public.employee_tasks.id;


--
-- Name: final_reviews; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: final_reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.final_reviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: final_reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.final_reviews_id_seq OWNED BY public.final_reviews.id;


--
-- Name: form_sections; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: form_sections_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.form_sections_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: form_sections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.form_sections_id_seq OWNED BY public.form_sections.id;


--
-- Name: form_static_blocks; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: form_static_blocks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.form_static_blocks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: form_static_blocks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.form_static_blocks_id_seq OWNED BY public.form_static_blocks.id;


--
-- Name: form_templates; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: form_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.form_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: form_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.form_templates_id_seq OWNED BY public.form_templates.id;


--
-- Name: goal_tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.goal_tasks (
    id integer NOT NULL,
    goal_id integer NOT NULL,
    task_number integer,
    task_description text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT goal_tasks_task_number_check CHECK (((task_number >= 1) AND (task_number <= 3)))
);


--
-- Name: goal_tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.goal_tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: goal_tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.goal_tasks_id_seq OWNED BY public.goal_tasks.id;


--
-- Name: manager_evaluations; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: manager_evaluations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.manager_evaluations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: manager_evaluations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.manager_evaluations_id_seq OWNED BY public.manager_evaluations.id;


--
-- Name: manager_recommendations; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: manager_recommendations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.manager_recommendations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: manager_recommendations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.manager_recommendations_id_seq OWNED BY public.manager_recommendations.id;


--
-- Name: manager_review_questions; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: manager_review_questions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.manager_review_questions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: manager_review_questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.manager_review_questions_id_seq OWNED BY public.manager_review_questions.id;


--
-- Name: manager_reviews; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: manager_reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.manager_reviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: manager_reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.manager_reviews_id_seq OWNED BY public.manager_reviews.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: peer_feedback_requests; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: peer_feedback_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.peer_feedback_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: peer_feedback_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.peer_feedback_requests_id_seq OWNED BY public.peer_feedback_requests.id;


--
-- Name: peer_feedbacks; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: peer_feedbacks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.peer_feedbacks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: peer_feedbacks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.peer_feedbacks_id_seq OWNED BY public.peer_feedbacks.id;


--
-- Name: peer_review_questions; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: peer_review_questions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.peer_review_questions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: peer_review_questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.peer_review_questions_id_seq OWNED BY public.peer_review_questions.id;


--
-- Name: peer_reviews; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: peer_reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.peer_reviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: peer_reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.peer_reviews_id_seq OWNED BY public.peer_reviews.id;


--
-- Name: performance_review_status; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: performance_review_status_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.performance_review_status_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: performance_review_status_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.performance_review_status_id_seq OWNED BY public.performance_review_status.id;


--
-- Name: potential_assessments; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: potential_assessments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.potential_assessments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: potential_assessments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.potential_assessments_id_seq OWNED BY public.potential_assessments.id;


--
-- Name: potential_detail_answers; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: potential_detail_answers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.potential_detail_answers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: potential_detail_answers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.potential_detail_answers_id_seq OWNED BY public.potential_detail_answers.id;


--
-- Name: potential_detail_questions; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: potential_detail_questions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.potential_detail_questions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: potential_detail_questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.potential_detail_questions_id_seq OWNED BY public.potential_detail_questions.id;


--
-- Name: recommendation_triggers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recommendation_triggers (
    id integer NOT NULL,
    trigger_word character varying(100) NOT NULL,
    recommendation_text text NOT NULL,
    category character varying(50),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: recommendation_triggers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.recommendation_triggers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: recommendation_triggers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.recommendation_triggers_id_seq OWNED BY public.recommendation_triggers.id;


--
-- Name: review_cycles; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: review_cycles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.review_cycles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: review_cycles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.review_cycles_id_seq OWNED BY public.review_cycles.id;


--
-- Name: review_periods; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.review_periods (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    is_active boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: review_periods_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.review_periods_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: review_periods_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.review_periods_id_seq OWNED BY public.review_periods.id;


--
-- Name: selected_respondents; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: selected_respondents_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.selected_respondents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: selected_respondents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.selected_respondents_id_seq OWNED BY public.selected_respondents.id;


--
-- Name: self_assessment_questions; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: self_assessment_questions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.self_assessment_questions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: self_assessment_questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.self_assessment_questions_id_seq OWNED BY public.self_assessment_questions.id;


--
-- Name: self_assessments; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: self_assessments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.self_assessments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: self_assessments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.self_assessments_id_seq OWNED BY public.self_assessments.id;


--
-- Name: task_annotations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_annotations (
    id integer NOT NULL,
    task_id integer NOT NULL,
    annotation_text text NOT NULL,
    source_sheet character varying(100) DEFAULT 'Распределение задач'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: task_annotations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.task_annotations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: task_annotations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.task_annotations_id_seq OWNED BY public.task_annotations.id;


--
-- Name: task_leads; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: task_leads_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.task_leads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: task_leads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.task_leads_id_seq OWNED BY public.task_leads.id;


--
-- Name: task_participants; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: task_participants_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.task_participants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: task_participants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.task_participants_id_seq OWNED BY public.task_participants.id;


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tasks_id_seq OWNED BY public.tasks.id;


--
-- Name: user_review_periods; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: user_review_periods_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_review_periods_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_review_periods_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_review_periods_id_seq OWNED BY public.user_review_periods.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: company_triggers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_triggers ALTER COLUMN id SET DEFAULT nextval('public.company_triggers_id_seq'::regclass);


--
-- Name: employee_goals id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_goals ALTER COLUMN id SET DEFAULT nextval('public.employee_goals_id_seq'::regclass);


--
-- Name: employee_recommendations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_recommendations ALTER COLUMN id SET DEFAULT nextval('public.employee_recommendations_id_seq'::regclass);


--
-- Name: employee_review_periods id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_review_periods ALTER COLUMN id SET DEFAULT nextval('public.employee_review_periods_id_seq'::regclass);


--
-- Name: employee_summaries id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_summaries ALTER COLUMN id SET DEFAULT nextval('public.employee_summaries_id_seq'::regclass);


--
-- Name: employee_tasks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_tasks ALTER COLUMN id SET DEFAULT nextval('public.employee_tasks_id_seq'::regclass);


--
-- Name: final_reviews id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.final_reviews ALTER COLUMN id SET DEFAULT nextval('public.final_reviews_id_seq'::regclass);


--
-- Name: form_sections id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_sections ALTER COLUMN id SET DEFAULT nextval('public.form_sections_id_seq'::regclass);


--
-- Name: form_static_blocks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_static_blocks ALTER COLUMN id SET DEFAULT nextval('public.form_static_blocks_id_seq'::regclass);


--
-- Name: form_templates id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_templates ALTER COLUMN id SET DEFAULT nextval('public.form_templates_id_seq'::regclass);


--
-- Name: goal_tasks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goal_tasks ALTER COLUMN id SET DEFAULT nextval('public.goal_tasks_id_seq'::regclass);


--
-- Name: manager_evaluations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manager_evaluations ALTER COLUMN id SET DEFAULT nextval('public.manager_evaluations_id_seq'::regclass);


--
-- Name: manager_recommendations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manager_recommendations ALTER COLUMN id SET DEFAULT nextval('public.manager_recommendations_id_seq'::regclass);


--
-- Name: manager_review_questions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manager_review_questions ALTER COLUMN id SET DEFAULT nextval('public.manager_review_questions_id_seq'::regclass);


--
-- Name: manager_reviews id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manager_reviews ALTER COLUMN id SET DEFAULT nextval('public.manager_reviews_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: peer_feedback_requests id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.peer_feedback_requests ALTER COLUMN id SET DEFAULT nextval('public.peer_feedback_requests_id_seq'::regclass);


--
-- Name: peer_feedbacks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.peer_feedbacks ALTER COLUMN id SET DEFAULT nextval('public.peer_feedbacks_id_seq'::regclass);


--
-- Name: peer_review_questions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.peer_review_questions ALTER COLUMN id SET DEFAULT nextval('public.peer_review_questions_id_seq'::regclass);


--
-- Name: peer_reviews id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.peer_reviews ALTER COLUMN id SET DEFAULT nextval('public.peer_reviews_id_seq'::regclass);


--
-- Name: performance_review_status id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.performance_review_status ALTER COLUMN id SET DEFAULT nextval('public.performance_review_status_id_seq'::regclass);


--
-- Name: potential_assessments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.potential_assessments ALTER COLUMN id SET DEFAULT nextval('public.potential_assessments_id_seq'::regclass);


--
-- Name: potential_detail_answers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.potential_detail_answers ALTER COLUMN id SET DEFAULT nextval('public.potential_detail_answers_id_seq'::regclass);


--
-- Name: potential_detail_questions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.potential_detail_questions ALTER COLUMN id SET DEFAULT nextval('public.potential_detail_questions_id_seq'::regclass);


--
-- Name: recommendation_triggers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recommendation_triggers ALTER COLUMN id SET DEFAULT nextval('public.recommendation_triggers_id_seq'::regclass);


--
-- Name: review_cycles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_cycles ALTER COLUMN id SET DEFAULT nextval('public.review_cycles_id_seq'::regclass);


--
-- Name: review_periods id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_periods ALTER COLUMN id SET DEFAULT nextval('public.review_periods_id_seq'::regclass);


--
-- Name: selected_respondents id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selected_respondents ALTER COLUMN id SET DEFAULT nextval('public.selected_respondents_id_seq'::regclass);


--
-- Name: self_assessment_questions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.self_assessment_questions ALTER COLUMN id SET DEFAULT nextval('public.self_assessment_questions_id_seq'::regclass);


--
-- Name: self_assessments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.self_assessments ALTER COLUMN id SET DEFAULT nextval('public.self_assessments_id_seq'::regclass);


--
-- Name: task_annotations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_annotations ALTER COLUMN id SET DEFAULT nextval('public.task_annotations_id_seq'::regclass);


--
-- Name: task_leads id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_leads ALTER COLUMN id SET DEFAULT nextval('public.task_leads_id_seq'::regclass);


--
-- Name: task_participants id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_participants ALTER COLUMN id SET DEFAULT nextval('public.task_participants_id_seq'::regclass);


--
-- Name: tasks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks ALTER COLUMN id SET DEFAULT nextval('public.tasks_id_seq'::regclass);


--
-- Name: user_review_periods id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_review_periods ALTER COLUMN id SET DEFAULT nextval('public.user_review_periods_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: company_triggers; Type: TABLE DATA; Schema: public; Owner: -
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
-- Data for Name: employee_goals; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.employee_goals (id, user_id, cycle_id, goal_number, title, description, expected_deadline, expected_results, key_tasks, status, created_at, updated_at, rejection_comment, period_id) VALUES (1, 9, 2, 1, 'Внедрить микросервисную архитектуру', 'Разделить монолит на 5 независимых сервисов', NULL, NULL, NULL, 'approved', '2025-10-24 09:29:58.136102', '2025-10-24 19:03:18.811696', NULL, 23);
INSERT INTO public.employee_goals (id, user_id, cycle_id, goal_number, title, description, expected_deadline, expected_results, key_tasks, status, created_at, updated_at, rejection_comment, period_id) VALUES (2, 10, 2, 1, 'Повысить покрытие тестами до 80%', 'Написать unit и integration тесты для критичных модулей', NULL, NULL, NULL, 'approved', '2025-10-24 09:29:58.139194', '2025-10-24 10:06:22.32098', NULL, 31);
INSERT INTO public.employee_goals (id, user_id, cycle_id, goal_number, title, description, expected_deadline, expected_results, key_tasks, status, created_at, updated_at, rejection_comment, period_id) VALUES (3, 11, 2, 1, 'Изучить React и TypeScript', 'Освоить современный стек фронтенда', NULL, NULL, NULL, 'approved', '2025-10-24 09:29:58.141177', '2025-10-24 09:44:07.3203', NULL, 32);
INSERT INTO public.employee_goals (id, user_id, cycle_id, goal_number, title, description, expected_deadline, expected_results, key_tasks, status, created_at, updated_at, rejection_comment, period_id) VALUES (4, 11, 2, 2, 'Изучить Git', '', '2025-12-08', '', '', 'approved', '2025-10-24 09:43:36.248152', '2025-10-28 18:53:10.176747', 'апафыалвы', 32);
INSERT INTO public.employee_goals (id, user_id, cycle_id, goal_number, title, description, expected_deadline, expected_results, key_tasks, status, created_at, updated_at, rejection_comment, period_id) VALUES (5, 12, 2, 1, 'Выучить английский язык', 'Мне надо!', '2026-05-03', '', '', 'approved', '2025-10-24 18:57:48.378049', '2025-10-31 18:40:26.779266', 'Нет описания. Зачем?', 26);
INSERT INTO public.employee_goals (id, user_id, cycle_id, goal_number, title, description, expected_deadline, expected_results, key_tasks, status, created_at, updated_at, rejection_comment, period_id) VALUES (6, 13, 2, 1, 'Изучить новый стек', '', '2026-06-01', '', '', 'approved', '2025-10-24 19:02:04.673894', '2025-10-24 19:06:16.0817', NULL, 33);
INSERT INTO public.employee_goals (id, user_id, cycle_id, goal_number, title, description, expected_deadline, expected_results, key_tasks, status, created_at, updated_at, rejection_comment, period_id) VALUES (10, 9, 2, NULL, 'Тестовая цель 1', 'Описание тестовой цели 1', NULL, NULL, NULL, 'approved', '2025-10-29 17:36:28.809014', '2025-10-29 17:37:44.814781', NULL, 23);
INSERT INTO public.employee_goals (id, user_id, cycle_id, goal_number, title, description, expected_deadline, expected_results, key_tasks, status, created_at, updated_at, rejection_comment, period_id) VALUES (11, 9, 2, NULL, 'Тестовая цель 2', 'Описание тестовой цели 2', NULL, NULL, NULL, 'approved', '2025-10-29 17:36:28.809014', '2025-10-29 17:37:39.717526', NULL, 23);
INSERT INTO public.employee_goals (id, user_id, cycle_id, goal_number, title, description, expected_deadline, expected_results, key_tasks, status, created_at, updated_at, rejection_comment, period_id) VALUES (12, 9, 2, NULL, 'Тестовая цель 3', 'Описание тестовой цели 3', NULL, NULL, NULL, 'approved', '2025-10-29 17:36:28.809014', '2025-10-29 17:37:42.311431', NULL, 23);


--
-- Data for Name: employee_recommendations; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.employee_recommendations (id, employee_id, hr_id, achievements, improvements, development_plan, sent_at, is_read, created_at) VALUES (6, 9, 3, '• Отличное выполнение проекта по автоматизации HR-процессов
• Внедрил систему аналитики для отдела продаж
• Сократил время обработки отчетов на 40%', '• Необходимо улучшить навыки планирования времени
• Рекомендуется развить навыки управления проектами
• Работа над коммуникацией с заинтересованными сторонами', '• Пройти курс по Time Management (до января 2026)
• Изучить Agile и Scrum методологии (до февраля 2026)
• Получить сертификацию PMP или аналог (до июня 2026)
• Возглавить проект средней сложности (Q1 2026)', '2025-10-31 20:18:57.374814', true, '2025-10-31 20:18:57.374814');
INSERT INTO public.employee_recommendations (id, employee_id, hr_id, achievements, improvements, development_plan, sent_at, is_read, created_at) VALUES (4, 10, 3, '• Успешно завершила проект по внедрению новой CRM системы
• Показала отличные навыки коммуникации с клиентами
• Выполнила план продаж на 115%', '• Рекомендуется улучшить навыки презентации
• Развить знания в области аналитики данных
• Работа над делегированием задач', '• Пройти курс "Эффективные презентации" (до марта 2026)
• Изучить основы SQL и Power BI (до апреля 2026)
• Участвовать в качестве ментора для нового сотрудника
• Посетить конференцию по продажам (Q1 2026)', '2025-10-31 20:18:57.369584', false, '2025-10-31 20:18:57.369584');
INSERT INTO public.employee_recommendations (id, employee_id, hr_id, achievements, improvements, development_plan, sent_at, is_read, created_at) VALUES (5, 13, 3, '• Реализовал 5 ключевых фич для мобильного приложения
• Улучшил производительность API на 30%
• Провел 3 технических воркшопа для команды', '• Необходимо улучшить навыки code review
• Рекомендуется больше внимания уделять документации
• Развитие soft skills для работы с заказчиками', '• Пройти курс "Clean Code и рефакторинг" (до февраля 2026)
• Написать техническую документацию для 3 модулей (до марта 2026)
• Стать code reviewer для джуниор разработчиков
• Изучить основы архитектуры микросервисов (Q1 2026)', '2025-10-31 20:18:57.372663', false, '2025-10-31 20:18:57.372663');
INSERT INTO public.employee_recommendations (id, employee_id, hr_id, achievements, improvements, development_plan, sent_at, is_read, created_at) VALUES (7, 7, 3, '• Успешно руководил командой из 5 человек
• Завершил 8 проектов в срок и в рамках бюджета
• Повысил удовлетворенность клиентов на 20%', '• Рекомендуется развить навыки стратегического планирования
• Улучшить делегирование и развитие команды
• Больше внимания уделять инновациям', '• Пройти курс "Стратегический менеджмент" (до марта 2026)
• Внедрить систему KPI для команды (до февраля 2026)
• Организовать ежемесячные innovation sessions
• Пройти executive MBA или аналог (начать в Q2 2026)', '2025-10-31 20:18:57.377453', false, '2025-10-31 20:18:57.377453');
INSERT INTO public.employee_recommendations (id, employee_id, hr_id, achievements, improvements, development_plan, sent_at, is_read, created_at) VALUES (8, 8, 3, '• Разработала новую систему подбора персонала
• Сократила время закрытия вакансий на 25%
• Организовала 10 успешных корпоративных мероприятий', '• Необходимо углубить знания в области компенсаций и льгот
• Развить навыки работы с HR-аналитикой
• Улучшить знание трудового законодательства', '• Пройти курс "Compensation & Benefits Management" (до апреля 2026)
• Освоить HR-аналитику и метрики (до марта 2026)
• Получить сертификацию HRCI или SHRM (до июня 2026)
• Внедрить новую систему оценки кандидатов (Q1 2026)', '2025-10-31 20:18:57.380682', false, '2025-10-31 20:18:57.380682');
INSERT INTO public.employee_recommendations (id, employee_id, hr_id, achievements, improvements, development_plan, sent_at, is_read, created_at) VALUES (10, 11, 3, '• Оптимизировал финансовые процессы компании
• Сократил издержки на 15% без потери качества
• Внедрил новую систему бюджетирования', '• Необходимо развить навыки финансового прогнозирования
• Рекомендуется изучить международные стандарты отчетности
• Улучшить презентационные навыки для совета директоров', '• Пройти курс "Financial Forecasting and Planning" (до марта 2026)
• Изучить IFRS и US GAAP (до апреля 2026)
• Пройти курс "Презентация финансовых данных" (до февраля 2026)
• Подготовить стратегический финансовый план на 3 года (Q1 2026)', '2025-10-31 20:18:57.384272', false, '2025-10-31 20:18:57.384272');
INSERT INTO public.employee_recommendations (id, employee_id, hr_id, achievements, improvements, development_plan, sent_at, is_read, created_at) VALUES (9, 12, 3, '• Создала комплексную стратегию контент-маркетинга
• Увеличила органический трафик на 50%
• Запустила 3 успешные рекламные кампании', '• Рекомендуется изучить SEO оптимизацию глубже
• Развить навыки видео-продукции
• Улучшить аналитические навыки (Google Analytics, Яндекс.Метрика)', '• Пройти курс "Advanced SEO" (до февраля 2026)
• Освоить видеомонтаж и создание роликов (до марта 2026)
• Получить сертификацию Google Analytics (до января 2026)
• Запустить подкаст компании (Q1 2026)', '2025-10-31 20:18:57.382479', true, '2025-10-31 20:18:57.382479');


--
-- Data for Name: employee_review_periods; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.employee_review_periods (id, user_id, name, start_date, end_date, is_active, created_at, status, manager_approved, manager_approved_at, manager_approved_by, hr_approved, hr_approved_at, hr_approved_by, self_assessment_completed, self_assessment_completed_at, peer_reviews_count, manager_evaluation_completed, manager_evaluation_completed_at, requested_early_at, manager_goals_evaluation_completed, manager_goals_evaluation_completed_at, peer_reviews_completed, cycle_id, potential_assessment_completed, calculated_at) VALUES (16, 10, 'Полугодие 2 - 2024', '2024-07-01', '2024-12-31', true, '2025-10-30 15:25:55.796592', 'completed', false, NULL, NULL, false, NULL, NULL, false, NULL, 0, false, NULL, NULL, false, NULL, false, NULL, false, NULL);
INSERT INTO public.employee_review_periods (id, user_id, name, start_date, end_date, is_active, created_at, status, manager_approved, manager_approved_at, manager_approved_by, hr_approved, hr_approved_at, hr_approved_by, self_assessment_completed, self_assessment_completed_at, peer_reviews_count, manager_evaluation_completed, manager_evaluation_completed_at, requested_early_at, manager_goals_evaluation_completed, manager_goals_evaluation_completed_at, peer_reviews_completed, cycle_id, potential_assessment_completed, calculated_at) VALUES (17, 11, 'Полугодие 1 - 2024', '2024-01-01', '2024-06-30', true, '2025-10-30 15:25:55.799254', 'completed', false, NULL, NULL, false, NULL, NULL, false, NULL, 0, false, NULL, NULL, false, NULL, false, NULL, false, NULL);
INSERT INTO public.employee_review_periods (id, user_id, name, start_date, end_date, is_active, created_at, status, manager_approved, manager_approved_at, manager_approved_by, hr_approved, hr_approved_at, hr_approved_by, self_assessment_completed, self_assessment_completed_at, peer_reviews_count, manager_evaluation_completed, manager_evaluation_completed_at, requested_early_at, manager_goals_evaluation_completed, manager_goals_evaluation_completed_at, peer_reviews_completed, cycle_id, potential_assessment_completed, calculated_at) VALUES (18, 11, 'Полугодие 2 - 2024', '2024-07-01', '2024-12-31', true, '2025-10-30 15:25:55.799254', 'completed', false, NULL, NULL, false, NULL, NULL, false, NULL, 0, false, NULL, NULL, false, NULL, false, NULL, false, NULL);
INSERT INTO public.employee_review_periods (id, user_id, name, start_date, end_date, is_active, created_at, status, manager_approved, manager_approved_at, manager_approved_by, hr_approved, hr_approved_at, hr_approved_by, self_assessment_completed, self_assessment_completed_at, peer_reviews_count, manager_evaluation_completed, manager_evaluation_completed_at, requested_early_at, manager_goals_evaluation_completed, manager_goals_evaluation_completed_at, peer_reviews_completed, cycle_id, potential_assessment_completed, calculated_at) VALUES (19, 12, 'Полугодие 1 - 2024', '2024-01-01', '2024-06-30', true, '2025-10-30 15:25:55.802054', 'completed', false, NULL, NULL, false, NULL, NULL, false, NULL, 0, false, NULL, NULL, false, NULL, false, NULL, false, NULL);
INSERT INTO public.employee_review_periods (id, user_id, name, start_date, end_date, is_active, created_at, status, manager_approved, manager_approved_at, manager_approved_by, hr_approved, hr_approved_at, hr_approved_by, self_assessment_completed, self_assessment_completed_at, peer_reviews_count, manager_evaluation_completed, manager_evaluation_completed_at, requested_early_at, manager_goals_evaluation_completed, manager_goals_evaluation_completed_at, peer_reviews_completed, cycle_id, potential_assessment_completed, calculated_at) VALUES (20, 12, 'Полугодие 2 - 2024', '2024-07-01', '2024-12-31', true, '2025-10-30 15:25:55.802054', 'completed', false, NULL, NULL, false, NULL, NULL, false, NULL, 0, false, NULL, NULL, false, NULL, false, NULL, false, NULL);
INSERT INTO public.employee_review_periods (id, user_id, name, start_date, end_date, is_active, created_at, status, manager_approved, manager_approved_at, manager_approved_by, hr_approved, hr_approved_at, hr_approved_by, self_assessment_completed, self_assessment_completed_at, peer_reviews_count, manager_evaluation_completed, manager_evaluation_completed_at, requested_early_at, manager_goals_evaluation_completed, manager_goals_evaluation_completed_at, peer_reviews_completed, cycle_id, potential_assessment_completed, calculated_at) VALUES (21, 13, 'Полугодие 1 - 2024', '2024-01-01', '2024-06-30', true, '2025-10-30 15:25:55.805262', 'completed', false, NULL, NULL, false, NULL, NULL, false, NULL, 0, false, NULL, NULL, false, NULL, false, NULL, false, NULL);
INSERT INTO public.employee_review_periods (id, user_id, name, start_date, end_date, is_active, created_at, status, manager_approved, manager_approved_at, manager_approved_by, hr_approved, hr_approved_at, hr_approved_by, self_assessment_completed, self_assessment_completed_at, peer_reviews_count, manager_evaluation_completed, manager_evaluation_completed_at, requested_early_at, manager_goals_evaluation_completed, manager_goals_evaluation_completed_at, peer_reviews_completed, cycle_id, potential_assessment_completed, calculated_at) VALUES (22, 13, 'Полугодие 2 - 2024', '2024-07-01', '2024-12-31', true, '2025-10-30 15:25:55.805262', 'completed', false, NULL, NULL, false, NULL, NULL, false, NULL, 0, false, NULL, NULL, false, NULL, false, NULL, false, NULL);
INSERT INTO public.employee_review_periods (id, user_id, name, start_date, end_date, is_active, created_at, status, manager_approved, manager_approved_at, manager_approved_by, hr_approved, hr_approved_at, hr_approved_by, self_assessment_completed, self_assessment_completed_at, peer_reviews_count, manager_evaluation_completed, manager_evaluation_completed_at, requested_early_at, manager_goals_evaluation_completed, manager_goals_evaluation_completed_at, peer_reviews_completed, cycle_id, potential_assessment_completed, calculated_at) VALUES (15, 10, 'Полугодие 1 - 2024', '2024-01-01', '2024-06-30', true, '2025-10-30 15:25:55.796592', 'completed', false, NULL, NULL, false, NULL, NULL, false, NULL, 0, false, NULL, '2025-10-30 16:18:16.212371', false, NULL, false, NULL, false, NULL);
INSERT INTO public.employee_review_periods (id, user_id, name, start_date, end_date, is_active, created_at, status, manager_approved, manager_approved_at, manager_approved_by, hr_approved, hr_approved_at, hr_approved_by, self_assessment_completed, self_assessment_completed_at, peer_reviews_count, manager_evaluation_completed, manager_evaluation_completed_at, requested_early_at, manager_goals_evaluation_completed, manager_goals_evaluation_completed_at, peer_reviews_completed, cycle_id, potential_assessment_completed, calculated_at) VALUES (14, 9, 'Полугодие 2 - 2024', '2024-07-01', '2024-12-31', false, '2025-10-30 15:25:55.789972', 'completed', false, NULL, NULL, false, NULL, NULL, false, NULL, 0, false, NULL, NULL, false, NULL, false, NULL, false, NULL);
INSERT INTO public.employee_review_periods (id, user_id, name, start_date, end_date, is_active, created_at, status, manager_approved, manager_approved_at, manager_approved_by, hr_approved, hr_approved_at, hr_approved_by, self_assessment_completed, self_assessment_completed_at, peer_reviews_count, manager_evaluation_completed, manager_evaluation_completed_at, requested_early_at, manager_goals_evaluation_completed, manager_goals_evaluation_completed_at, peer_reviews_completed, cycle_id, potential_assessment_completed, calculated_at) VALUES (25, 11, 'Полугодие 1 - 2025 (Петр)', '2025-06-15', '2025-12-15', true, '2025-10-30 19:23:10.834932', 'not_started', false, NULL, NULL, false, NULL, NULL, false, NULL, 0, false, NULL, NULL, false, NULL, false, 1, false, NULL);
INSERT INTO public.employee_review_periods (id, user_id, name, start_date, end_date, is_active, created_at, status, manager_approved, manager_approved_at, manager_approved_by, hr_approved, hr_approved_at, hr_approved_by, self_assessment_completed, self_assessment_completed_at, peer_reviews_count, manager_evaluation_completed, manager_evaluation_completed_at, requested_early_at, manager_goals_evaluation_completed, manager_goals_evaluation_completed_at, peer_reviews_completed, cycle_id, potential_assessment_completed, calculated_at) VALUES (27, 13, 'Полугодие 1 - 2025 (Дмитрий)', '2025-06-10', '2025-12-10', true, '2025-10-30 19:23:10.840883', 'not_started', false, NULL, NULL, false, NULL, NULL, false, NULL, 0, false, NULL, NULL, false, NULL, false, 1, false, NULL);
INSERT INTO public.employee_review_periods (id, user_id, name, start_date, end_date, is_active, created_at, status, manager_approved, manager_approved_at, manager_approved_by, hr_approved, hr_approved_at, hr_approved_by, self_assessment_completed, self_assessment_completed_at, peer_reviews_count, manager_evaluation_completed, manager_evaluation_completed_at, requested_early_at, manager_goals_evaluation_completed, manager_goals_evaluation_completed_at, peer_reviews_completed, cycle_id, potential_assessment_completed, calculated_at) VALUES (13, 9, 'Полугодие 1 - 2025 (Иван)', '2025-05-31', '2025-11-29', true, '2025-10-30 15:25:55.789972', 'awaiting_calculation', true, '2025-10-30 17:59:37.703606', 7, true, '2025-10-30 18:09:07.85143', 3, true, '2025-10-30 18:28:19.629138', 0, false, NULL, '2025-10-30 17:59:13.597189', true, '2025-10-30 20:56:21.568197', true, 1, true, NULL);
INSERT INTO public.employee_review_periods (id, user_id, name, start_date, end_date, is_active, created_at, status, manager_approved, manager_approved_at, manager_approved_by, hr_approved, hr_approved_at, hr_approved_by, self_assessment_completed, self_assessment_completed_at, peer_reviews_count, manager_evaluation_completed, manager_evaluation_completed_at, requested_early_at, manager_goals_evaluation_completed, manager_goals_evaluation_completed_at, peer_reviews_completed, cycle_id, potential_assessment_completed, calculated_at) VALUES (24, 10, 'Полугодие 1 - 2025 (Анна)', '2025-06-01', '2025-11-30', true, '2025-10-30 19:23:10.83', 'awaiting_calculation', true, '2025-10-31 14:26:49.175215', 7, true, '2025-10-31 14:26:56.737762', 3, true, '2025-10-31 14:30:03.540405', 0, false, NULL, '2025-10-31 14:26:40.657248', true, '2025-10-31 14:35:58.382399', true, 1, true, NULL);
INSERT INTO public.employee_review_periods (id, user_id, name, start_date, end_date, is_active, created_at, status, manager_approved, manager_approved_at, manager_approved_by, hr_approved, hr_approved_at, hr_approved_by, self_assessment_completed, self_assessment_completed_at, peer_reviews_count, manager_evaluation_completed, manager_evaluation_completed_at, requested_early_at, manager_goals_evaluation_completed, manager_goals_evaluation_completed_at, peer_reviews_completed, cycle_id, potential_assessment_completed, calculated_at) VALUES (28, 7, 'Полугодие 2 - 2025 - Кирилл Менеджеров', '2025-07-01', '2025-12-31', true, '2025-10-31 19:40:40.419448', 'completed', false, NULL, NULL, false, NULL, NULL, false, NULL, 0, false, NULL, NULL, false, NULL, false, 2, false, NULL);
INSERT INTO public.employee_review_periods (id, user_id, name, start_date, end_date, is_active, created_at, status, manager_approved, manager_approved_at, manager_approved_by, hr_approved, hr_approved_at, hr_approved_by, self_assessment_completed, self_assessment_completed_at, peer_reviews_count, manager_evaluation_completed, manager_evaluation_completed_at, requested_early_at, manager_goals_evaluation_completed, manager_goals_evaluation_completed_at, peer_reviews_completed, cycle_id, potential_assessment_completed, calculated_at) VALUES (29, 8, 'Полугодие 2 - 2025 - Мария Петрова', '2025-07-01', '2025-12-31', true, '2025-10-31 19:40:40.429601', 'completed', false, NULL, NULL, false, NULL, NULL, false, NULL, 0, false, NULL, NULL, false, NULL, false, 2, false, NULL);
INSERT INTO public.employee_review_periods (id, user_id, name, start_date, end_date, is_active, created_at, status, manager_approved, manager_approved_at, manager_approved_by, hr_approved, hr_approved_at, hr_approved_by, self_assessment_completed, self_assessment_completed_at, peer_reviews_count, manager_evaluation_completed, manager_evaluation_completed_at, requested_early_at, manager_goals_evaluation_completed, manager_goals_evaluation_completed_at, peer_reviews_completed, cycle_id, potential_assessment_completed, calculated_at) VALUES (23, 9, 'Полугодие 2 - 2025 (Иван)', '2025-07-01', '2025-12-31', false, '2025-10-30 19:12:31.640948', 'completed', false, NULL, NULL, false, NULL, NULL, false, NULL, 0, false, NULL, NULL, false, NULL, false, 2, false, NULL);
INSERT INTO public.employee_review_periods (id, user_id, name, start_date, end_date, is_active, created_at, status, manager_approved, manager_approved_at, manager_approved_by, hr_approved, hr_approved_at, hr_approved_by, self_assessment_completed, self_assessment_completed_at, peer_reviews_count, manager_evaluation_completed, manager_evaluation_completed_at, requested_early_at, manager_goals_evaluation_completed, manager_goals_evaluation_completed_at, peer_reviews_completed, cycle_id, potential_assessment_completed, calculated_at) VALUES (31, 10, 'Полугодие 2 - 2025 - Анна Сидорова', '2025-07-01', '2025-12-31', true, '2025-10-31 19:41:11.021946', 'completed', false, NULL, NULL, false, NULL, NULL, false, NULL, 0, false, NULL, NULL, false, NULL, false, 2, false, NULL);
INSERT INTO public.employee_review_periods (id, user_id, name, start_date, end_date, is_active, created_at, status, manager_approved, manager_approved_at, manager_approved_by, hr_approved, hr_approved_at, hr_approved_by, self_assessment_completed, self_assessment_completed_at, peer_reviews_count, manager_evaluation_completed, manager_evaluation_completed_at, requested_early_at, manager_goals_evaluation_completed, manager_goals_evaluation_completed_at, peer_reviews_completed, cycle_id, potential_assessment_completed, calculated_at) VALUES (32, 11, 'Полугодие 2 - 2025 - Петр Петров', '2025-07-01', '2025-12-31', true, '2025-10-31 19:41:11.025022', 'completed', false, NULL, NULL, false, NULL, NULL, false, NULL, 0, false, NULL, NULL, false, NULL, false, 2, false, NULL);
INSERT INTO public.employee_review_periods (id, user_id, name, start_date, end_date, is_active, created_at, status, manager_approved, manager_approved_at, manager_approved_by, hr_approved, hr_approved_at, hr_approved_by, self_assessment_completed, self_assessment_completed_at, peer_reviews_count, manager_evaluation_completed, manager_evaluation_completed_at, requested_early_at, manager_goals_evaluation_completed, manager_goals_evaluation_completed_at, peer_reviews_completed, cycle_id, potential_assessment_completed, calculated_at) VALUES (26, 12, 'Полугодие 1 - 2025 (Ольга)', '2025-07-01', '2025-12-31', true, '2025-10-30 19:23:10.838016', 'completed', false, NULL, NULL, false, NULL, NULL, false, NULL, 0, false, NULL, NULL, false, NULL, false, 2, false, NULL);
INSERT INTO public.employee_review_periods (id, user_id, name, start_date, end_date, is_active, created_at, status, manager_approved, manager_approved_at, manager_approved_by, hr_approved, hr_approved_at, hr_approved_by, self_assessment_completed, self_assessment_completed_at, peer_reviews_count, manager_evaluation_completed, manager_evaluation_completed_at, requested_early_at, manager_goals_evaluation_completed, manager_goals_evaluation_completed_at, peer_reviews_completed, cycle_id, potential_assessment_completed, calculated_at) VALUES (33, 13, 'Полугодие 2 - 2025 - Дмитрий Смирнов', '2025-07-01', '2025-12-31', true, '2025-10-31 19:41:11.031106', 'completed', false, NULL, NULL, false, NULL, NULL, false, NULL, 0, false, NULL, NULL, false, NULL, false, 2, false, NULL);


--
-- Data for Name: employee_summaries; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.employee_summaries (id, employee_id, cycle_id, summary_text, created_at, updated_at) VALUES (1, 3, 2, '', '2025-10-31 17:24:25.480408', '2025-10-31 17:24:25.480408');


--
-- Data for Name: employee_tasks; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: final_reviews; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: form_sections; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: form_static_blocks; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: form_templates; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: goal_tasks; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.goal_tasks (id, goal_id, task_number, task_description, created_at) VALUES (1, 10, 1, 'Тестовая задача 1', '2025-10-29 17:36:28.809014');
INSERT INTO public.goal_tasks (id, goal_id, task_number, task_description, created_at) VALUES (2, 11, 1, 'Тестовая задача 2', '2025-10-29 17:36:28.809014');
INSERT INTO public.goal_tasks (id, goal_id, task_number, task_description, created_at) VALUES (3, 12, 1, 'Тестовая задача 3', '2025-10-29 17:36:28.809014');


--
-- Data for Name: manager_evaluations; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.manager_evaluations (id, employee_id, manager_id, cycle_id, professional_qualities_score, personal_qualities_score, communication_with_colleagues, employee_development_willingness, considers_as_successor, development_readiness, turnover_risk_score, priorities_from_opz, performance_total, potential_total, created_at, updated_at, result_achievement_rating, personal_qualities_comment, personal_contribution_comment, interaction_quality_rating, improvement_suggestions, overall_rating, feedback_summary, goal_id) VALUES (16, 7, 3, 2, 3, 4, NULL, NULL, NULL, NULL, NULL, NULL, 6, 7, '2025-10-24 13:26:55.116922', '2025-10-24 13:26:55.116922', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.manager_evaluations (id, employee_id, manager_id, cycle_id, professional_qualities_score, personal_qualities_score, communication_with_colleagues, employee_development_willingness, considers_as_successor, development_readiness, turnover_risk_score, priorities_from_opz, performance_total, potential_total, created_at, updated_at, result_achievement_rating, personal_qualities_comment, personal_contribution_comment, interaction_quality_rating, improvement_suggestions, overall_rating, feedback_summary, goal_id) VALUES (20, 10, 7, 2, 5, 4, true, true, true, '1-2_years', 1, NULL, 9, 9, '2025-10-24 17:07:57.064101', '2025-10-24 17:07:57.064101', 10, NULL, NULL, 10, NULL, 10, 'Отличный сотрудник с высоким потенциалом роста', NULL);
INSERT INTO public.manager_evaluations (id, employee_id, manager_id, cycle_id, professional_qualities_score, personal_qualities_score, communication_with_colleagues, employee_development_willingness, considers_as_successor, development_readiness, turnover_risk_score, priorities_from_opz, performance_total, potential_total, created_at, updated_at, result_achievement_rating, personal_qualities_comment, personal_contribution_comment, interaction_quality_rating, improvement_suggestions, overall_rating, feedback_summary, goal_id) VALUES (21, 9, 7, 2, 5, 4, true, true, false, '3_years', 2, NULL, 8, 6, '2025-10-24 17:07:57.079044', '2025-10-24 17:07:57.079044', 8, NULL, NULL, 7, NULL, 8, 'Стабильные высокие результаты', NULL);
INSERT INTO public.manager_evaluations (id, employee_id, manager_id, cycle_id, professional_qualities_score, personal_qualities_score, communication_with_colleagues, employee_development_willingness, considers_as_successor, development_readiness, turnover_risk_score, priorities_from_opz, performance_total, potential_total, created_at, updated_at, result_achievement_rating, personal_qualities_comment, personal_contribution_comment, interaction_quality_rating, improvement_suggestions, overall_rating, feedback_summary, goal_id) VALUES (22, 11, 7, 2, 4, 4, true, false, false, '3_years', 2, NULL, 7, 6, '2025-10-24 17:07:57.083051', '2025-10-24 17:07:57.083051', 7, NULL, NULL, 7, NULL, 7, 'Надежный специалист', NULL);
INSERT INTO public.manager_evaluations (id, employee_id, manager_id, cycle_id, professional_qualities_score, personal_qualities_score, communication_with_colleagues, employee_development_willingness, considers_as_successor, development_readiness, turnover_risk_score, priorities_from_opz, performance_total, potential_total, created_at, updated_at, result_achievement_rating, personal_qualities_comment, personal_contribution_comment, interaction_quality_rating, improvement_suggestions, overall_rating, feedback_summary, goal_id) VALUES (23, 12, 7, 2, 3, 3, false, true, false, '3+_years', 3, NULL, 5, 5, '2025-10-24 17:07:57.08633', '2025-10-24 17:07:57.08633', 5, NULL, NULL, 5, NULL, 5, 'Средние результаты, есть потенциал', NULL);
INSERT INTO public.manager_evaluations (id, employee_id, manager_id, cycle_id, professional_qualities_score, personal_qualities_score, communication_with_colleagues, employee_development_willingness, considers_as_successor, development_readiness, turnover_risk_score, priorities_from_opz, performance_total, potential_total, created_at, updated_at, result_achievement_rating, personal_qualities_comment, personal_contribution_comment, interaction_quality_rating, improvement_suggestions, overall_rating, feedback_summary, goal_id) VALUES (24, 13, 7, 2, 2, 2, false, false, false, 'not_ready', 5, NULL, 3, 2, '2025-10-24 17:07:57.09077', '2025-10-24 17:07:57.09077', 3, NULL, NULL, 3, NULL, 3, 'Требует значительного развития', NULL);
INSERT INTO public.manager_evaluations (id, employee_id, manager_id, cycle_id, professional_qualities_score, personal_qualities_score, communication_with_colleagues, employee_development_willingness, considers_as_successor, development_readiness, turnover_risk_score, priorities_from_opz, performance_total, potential_total, created_at, updated_at, result_achievement_rating, personal_qualities_comment, personal_contribution_comment, interaction_quality_rating, improvement_suggestions, overall_rating, feedback_summary, goal_id) VALUES (31, 9, 7, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-30 20:56:21.562174', '2025-10-30 20:56:21.562174', 8, 'Всегда выполняет все поставленные задачи четко в срок. Очень педантичен и аккуратен в работе', 'Он очень хорошо подгоняет команду, однозначный лидер', 5, 'Быть мягче с коллегами, и проще относится к ошибкам команды', 8, 'Иван Иванов продемонстрировал высокий уровень результативности и лидерских качеств в течение отчетного периода. Его общая оценка работы составляет 8/10.

В достижении результатов Иван показал себя с лучшей стороны, выполняя все поставленные задачи четко и в срок. Его педантичность и аккуратность в работе заслуживают высокой оценки. Как лидер, он очень хорошо подгоняет команду, и его вклад в командную работу неоспорим.

Однако, оценка качества взаимодействия с коллегами составила 5/10. Обратная связь от коллег дает нам представление о том, что Иван иногда может быть резким во время горящих дедлайнов и не всегда внимателен к мнению других. Коллега 1, Content Manager, отметил, что Иван всегда четко выполняет обязанности, но иногда может грубить во время горящих дедлайнов. Коллега 2, Marketing Manager, оценил его взаимодействие как среднее, дав оценку 7/10. Коллега 3, Middle Developer, дал более низкую оценку, отметив, что Иван порой ведет себя как царь и не всегда внимателен к коллегам.

Самооценка Ивана показывает, что он активно работал над развитием своих навыков, изучая новые технологии React и Node.js, и применил их в проекте. Он также прошел курс по архитектуре приложений и успешно завершил все запланированные задачи, реализовав новую функциональность для системы Performance Review и улучшив производительность на 30%.

Ключевые сильные стороны Ивана - это его лидерские качества, умение работать в команде, и высокий уровень исполнительности. Он всегда выполняет задачи в срок и аккуратно подходит к работе.

Однако, есть несколько областей, где Ивану необходимо улучшиться. Во-первых, ему необходимо работать над коммуникативными навыками и быть более внимательным к коллегам. Это включает в себя умение слушать и учитывать мнение других, а также более конструктивно выражать свои мысли и замечания.

Во-вторых, Ивану необходимо быть более гибким и адаптивным в работе с командой. Это означает, что ему нужно быть более терпимым к ошибкам и неудачам, и не требовать идеальности от других.

В-третьих, Ивану необходимо продолжать развивать свои технические навыки, в том числе в направлении архитектуры систем, изучении микросервисов и cloud-технологий.

В целом, Иван показал себя как сильный и результативный сотрудник, и я уверен, что с учетом рекомендаций и областей для развития, он сможет еще больше улучшить свои результаты и вырасти как профессионал.', NULL);
INSERT INTO public.manager_evaluations (id, employee_id, manager_id, cycle_id, professional_qualities_score, personal_qualities_score, communication_with_colleagues, employee_development_willingness, considers_as_successor, development_readiness, turnover_risk_score, priorities_from_opz, performance_total, potential_total, created_at, updated_at, result_achievement_rating, personal_qualities_comment, personal_contribution_comment, interaction_quality_rating, improvement_suggestions, overall_rating, feedback_summary, goal_id) VALUES (32, 10, 7, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-31 14:35:58.375548', '2025-10-31 14:35:58.375548', 7, 'Анна демонстрирует хорошие технические навыки и внимание к деталям при тестировании. Её инициативность проявляется в предложениях по улучшению процессов (внедрение CI/CD). Обладает настойчивостью при решении сложных задач. В то же время, работает волнообразно — периоды высокой продуктивности чередуются с потерей фокуса. Требуется развивать систематичность подхода.', 'Как руководитель вижу, что Анна проактивно улучшала тестовый стек команды и помогала коллегам с инструментами. Однако качество её внутреннего взаимодействия оценивается коллегами неоднозначно — от отличного до нуждающегося в улучшении. Это говорит либо о необходимости лучше коммуницировать статус работы, либо о разном восприятии работы её разными партнёрами.', 7, 'Коллеги дают противоречивые оценки (от 10/10 до 2/10). В среднем взаимодействие хорошее, но требует внимания. Анна должна улучшить прозрачность в коммуникации о статусе и потенциальных рисках. Рекомендуется также работать над консистентностью в общении с разными членами команды.', 6, 'Завершая отчетный период, я хотел бы подвести итоги работы Анны Сидоровой и предоставить ей конструктивную обратную связь, направленную на ее профессиональный рост.

В целом, я оцениваю работу Анны за период на твердую 6/10. Этот результат отражает как значительные достижения, так и области для улучшения. Анна продемонстрировала хорошие технические навыки и внимание к деталям при тестировании, что является несомненной сильной стороной. Ее инициативность в предложениях по улучшению процессов, например, во внедрении CI/CD, заслуживает похвалы. Кроме того, она обладает настойчивостью при решении сложных задач, что является ценным качеством для специалиста в области тестирования.

Однако, анализ работы Анны показывает, что ей не хватает систематичности в подходе. Ее работа характеризуется волнообразностью — периодами высокой продуктивности, чередующимися с потерей фокуса. Это требует развития с ее стороны для повышения общей эффективности.

В части взаимодействия с коллегами, Анна получает противоречивые оценки. Отличные отзывы от некоторых коллег, которые ценят ее профессионализм, внимание к деталям и готовность помочь, контрастируют с менее позитивными оценками от других. Это расхождение может быть связано либо с необходимостью улучшения коммуникации о статусе работы и потенциальных рисках, либо с разным восприятием ее работы разными партнерами.

Учитывая обратную связь от коллег, становится ясно, что Анна воспринимается как образцовый профессионал и командный игрок некоторыми из них. Ее технические навыки, стратегическое мышление и готовность делиться опытом высоко ценятся. Однако, другие коллеги указывают на необходимость улучшения системности в работе, внимательности к деталям и навыков коммуникации.

Ключевыми сильными сторонами Анны являются ее технические навыки, инициативность и настойчивость. Эти качества являются основой для ее профессионального роста и дальнейшего развития.

В то же время, есть конкретные области для развития. Во-первых, Анне необходимо работать над систематичностью своего подхода к работе, чтобы повысить эффективность и уменьшить волнообразность. Во-вторых, ей следует улучшить коммуникацию о статусе работы и потенциальных рисках, чтобы сделать взаимодействие с коллегами более прозрачным и эффективным. В-третьих, Анне рекомендуется развивать навыки принятия конструктивной критики без личных обид и улучшать дисциплину и ответственность за качество своей работы.

Для улучшения, я рекомендую Анне сосредоточиться на следующих аспектах:

1. Развитие систематичности в подходе к работе, включая более равномерное распределение усилий и фокуса на задачах.
2. Улучшение коммуникации о статусе работы и потенциальных рисках для повышения прозрачности и доверия в команде.
3. Развитие навыков принятия конструктивной критики и улучшение дисциплины и ответственности за качество работы.

В заключение, я вижу в Анне потенциал для роста и развития как специалиста в области тестирования. Сосредоточившись на указанных областях для улучшения и развивая свои сильные стороны, она может повысить свою эффективность и внести еще больший вклад в команду.', NULL);


--
-- Data for Name: manager_recommendations; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.manager_recommendations (id, employee_id, manager_id, hr_id, recommendations, sent_at, is_read, created_at, period_id) VALUES (1, 10, 7, 3, '**Стиль управления:** 
Анна хорошо реагирует на делегирование ответственности и автономию. Она мотивирована вызовами и возможностью развивать новые навыки.

**Рекомендации по взаимодействию:**
• Проводите еженедельные 1-на-1 встречи для обсуждения прогресса и барьеров
• Поощряйте ее инициативу в новых проектах, особенно связанных с CRM и аналитикой
• Давайте конструктивную обратную связь сразу, не откладывая
• Вовлекайте в стратегические обсуждения - она ценит понимание "большой картины"

**Зоны роста:**
• Помогите развить навыки презентации через практику и feedback
• Поддержите в изучении аналитических инструментов (предложите курсы)
• Обсуждайте делегирование - научите передавать рутинные задачи

**Мотивация:** Признание достижений, новые вызовы, профессиональное развитие

**Осторожно:** Может перегружать себя работой, следите за work-life balance', '2025-10-31 20:32:05.185889', false, '2025-10-31 20:32:05.185889', 31);
INSERT INTO public.manager_recommendations (id, employee_id, manager_id, hr_id, recommendations, sent_at, is_read, created_at, period_id) VALUES (2, 13, 7, 3, '**Стиль управления:**
Дмитрий - технический эксперт, который ценит четкие цели и автономность в их достижении. Предпочитает структурированный подход и измеримые результаты.

**Рекомендации по взаимодействию:**
• Ставьте четкие, измеримые технические цели с конкретными дедлайнами
• Вовлекайте в code review процесс - это поможет развить его навыки менторства
• Обсуждайте архитектурные решения, спрашивайте его экспертное мнение
• Давайте возможность проводить технические воркшопы для команды

**Зоны роста:**
• Развитие soft skills - поощряйте участие во встречах с заказчиками
• Улучшение документирования кода - покажите важность для команды
• Навыки менторства - назначьте его code reviewer для джуниоров

**Мотивация:** Технические вызовы, признание экспертизы, возможность обучать других

**Осторожно:** Может уходить "в код" и игнорировать командную работу, следите за вовлеченностью', '2025-10-31 20:32:05.19147', false, '2025-10-31 20:32:05.19147', 33);
INSERT INTO public.manager_recommendations (id, employee_id, manager_id, hr_id, recommendations, sent_at, is_read, created_at, period_id) VALUES (4, 7, 7, 3, '**Стиль управления:**
Кирилл - опытный менеджер, нуждающийся в развитии стратегического мышления и делегирования.

**Рекомендации по взаимодействию:**
• Вовлекайте в стратегическое планирование компании
• Обсуждайте долгосрочные цели и KPI, а не только текущие задачи
• Поддержите в развитии навыков делегирования - показывайте примеры
• Создавайте возможности для инноваций в его команде

**Зоны роста:**
• Стратегическое планирование - давайте проекты с долгосрочной перспективой
• Развитие команды - поощряйте менторство и обучение подчиненных
• Внедрение инноваций - выделите time и ресурсы для innovation sessions

**Мотивация:** Стратегические вызовы, развитие команды, влияние на бизнес-процессы

**Осторожно:** Может углубляться в операционку, напоминайте о стратегических задачах', '2025-10-31 20:32:05.195327', false, '2025-10-31 20:32:05.195327', 28);
INSERT INTO public.manager_recommendations (id, employee_id, manager_id, hr_id, recommendations, sent_at, is_read, created_at, period_id) VALUES (5, 8, 7, 3, '**Стиль управления:**
Мария - HR профессионал с творческим подходом, ценит систематичность и возможность влиять на корпоративную культуру.

**Рекомендации по взаимодействию:**
• Давайте проекты по улучшению HR-процессов и корпоративной культуры
• Поддерживайте в изучении HR-аналитики и метрик
• Вовлекайте в стратегические HR-инициативы
• Цените креативный подход к мероприятиям и подбору

**Зоны роста:**
• Компенсации и льготы - поддержите в профессиональном обучении
• HR-аналитика - давайте задачи с data-driven подходом
• Трудовое право - организуйте курсы или консультации с юристами

**Мотивация:** Влияние на культуру компании, признание креативных решений, профессиональное развитие

**Осторожно:** Может уделять слишком много внимания мероприятиям в ущерб аналитике', '2025-10-31 20:32:05.197171', false, '2025-10-31 20:32:05.197171', 29);
INSERT INTO public.manager_recommendations (id, employee_id, manager_id, hr_id, recommendations, sent_at, is_read, created_at, period_id) VALUES (7, 11, 7, 3, '**Стиль управления:**
Петр - финансист-аналитик с сильными техническими навыками, ценит точность и структурированность.

**Рекомендации по взаимодействию:**
• Вовлекайте в стратегическое финансовое планирование
• Обсуждайте финансовые прогнозы и их влияние на бизнес-решения
• Давайте проекты по оптимизации процессов
• Поддержите в развитии презентационных навыков

**Зоны роста:**
• Финансовое прогнозирование - дайте ответственность за бюджет компании
• Международные стандарты отчетности - организуйте обучение
• Презентационные навыки - практикуйте через регулярные отчеты руководству

**Мотивация:** Сложные аналитические задачи, влияние на финансовые решения, профессиональное признание

**Осторожно:** Может слишком углубляться в детали, помогайте видеть "большую картину"', '2025-10-31 20:32:05.201425', false, '2025-10-31 20:32:05.201425', 32);
INSERT INTO public.manager_recommendations (id, employee_id, manager_id, hr_id, recommendations, sent_at, is_read, created_at, period_id) VALUES (3, 9, 7, 3, '**Стиль управления:**
Иван - проактивный сотрудник с сильными аналитическими навыками, но нуждается в улучшении time management и приоритизации.

**Рекомендации по взаимодействию:**
• Помогите структурировать рабочий день - используйте техники тайм-менеджмента
• Проводите регулярные check-in для отслеживания прогресса и корректировки приоритетов
• Обсуждайте важность vs срочность задач
• Поддержите в изучении Agile/Scrum методологий

**Зоны роста:**
• Планирование времени - научите использовать инструменты (календари, time blocking)
• Управление ожиданиями stakeholders - отрабатывайте на практике
• Делегирование и приоритизация - показывайте примеры

**Мотивация:** Решение сложных задач, видимый impact на бизнес, развитие управленческих навыков

**Осторожно:** Может брать слишком много задач одновременно, помогайте фокусироваться на главном', '2025-10-31 20:32:05.193009', false, '2025-10-31 20:32:05.193009', 23);
INSERT INTO public.manager_recommendations (id, employee_id, manager_id, hr_id, recommendations, sent_at, is_read, created_at, period_id) VALUES (6, 12, 7, 3, '**Стиль управления:**
Ольга - креативный маркетолог с сильными навыками контент-маркетинга, нуждается в развитии технических навыков.

**Рекомендации по взаимодействию:**
• Давайте свободу в креативных решениях, но ставьте измеримые KPI
• Обсуждайте результаты кампаний с точки зрения метрик
• Поддержите в изучении SEO и аналитики
• Поощряйте эксперименты с новыми форматами контента

**Зоны роста:**
• SEO и техническая оптимизация - организуйте обучение
• Видео-производство - дайте проект для практики
• Аналитика (GA, Метрика) - требуйте data-driven отчеты

**Мотивация:** Креативная свобода, видимые результаты кампаний, новые форматы контента

**Осторожно:** Может увлекаться креативом без анализа эффективности, требуйте метрики', '2025-10-31 20:32:05.199025', false, '2025-10-31 20:32:05.199025', 26);


--
-- Data for Name: manager_review_questions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.manager_review_questions (id, question_text, question_type, max_score, weight, is_active, display_order, created_at) VALUES (2, 'Качество выполнения работы', 'scale_0_10', 10, 1.00, true, 1, '2025-10-24 15:03:39.483914');
INSERT INTO public.manager_review_questions (id, question_text, question_type, max_score, weight, is_active, display_order, created_at) VALUES (3, 'Соблюдение сроков', 'scale_0_10', 10, 1.00, true, 2, '2025-10-24 15:03:39.48846');
INSERT INTO public.manager_review_questions (id, question_text, question_type, max_score, weight, is_active, display_order, created_at) VALUES (4, 'Инициативность', 'scale_0_10', 10, 1.00, true, 3, '2025-10-24 15:03:39.49013');
INSERT INTO public.manager_review_questions (id, question_text, question_type, max_score, weight, is_active, display_order, created_at) VALUES (5, 'Коммуникабельность', 'scale_0_10', 10, 1.00, true, 4, '2025-10-24 15:03:39.491724');
INSERT INTO public.manager_review_questions (id, question_text, question_type, max_score, weight, is_active, display_order, created_at) VALUES (6, 'Способность работать в команде', 'scale_0_10', 10, 1.00, true, 5, '2025-10-24 15:03:39.493142');


--
-- Data for Name: manager_reviews; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.notifications (id, user_id, type, title, message, related_user_id, related_id, is_read, read_at, created_at) VALUES (6, 7, 'peer_reviews_completed', 'Все peer отзывы получены', 'Иван Иванов получил все peer отзывы для периода "Полугодие 1 - 2025 (Иван)". Можно переходить к оценке руководителя.', 9, NULL, false, NULL, '2025-10-30 19:48:44.120108');
INSERT INTO public.notifications (id, user_id, type, title, message, related_user_id, related_id, is_read, read_at, created_at) VALUES (7, 7, 'peer_reviews_completed', 'Все peer отзывы получены', 'Иван Иванов получил все peer отзывы для периода "Полугодие 1 - 2025 (Иван)". Можно переходить к оценке руководителя.', 9, NULL, false, NULL, '2025-10-30 19:48:57.151451');
INSERT INTO public.notifications (id, user_id, type, title, message, related_user_id, related_id, is_read, read_at, created_at) VALUES (8, 7, 'potential_assessment_ready', 'Готово к оценке потенциала', 'Иван Иванов готов к оценке потенциала', 9, 13, false, NULL, '2025-10-30 20:56:21.574251');
INSERT INTO public.notifications (id, user_id, type, title, message, related_user_id, related_id, is_read, read_at, created_at) VALUES (9, 9, 'potential_assessment_submitted', 'Оценка потенциала завершена', 'Руководитель завершил оценку вашего потенциала. Ожидайте расчета итогов.', NULL, NULL, false, NULL, '2025-10-31 14:23:02.094952');
INSERT INTO public.notifications (id, user_id, type, title, message, related_user_id, related_id, is_read, read_at, created_at) VALUES (13, 13, 'peer_feedback_request', 'Запрос на оценку', 'Анна Сидорова запросил у вас peer review для периода "Полугодие 1 - 2025 (Анна)"', 10, 41, false, NULL, '2025-10-31 14:30:16.412072');
INSERT INTO public.notifications (id, user_id, type, title, message, related_user_id, related_id, is_read, read_at, created_at) VALUES (14, 9, 'peer_feedback_request', 'Запрос на оценку', 'Анна Сидорова запросил у вас peer review для периода "Полугодие 1 - 2025 (Анна)"', 10, 42, false, NULL, '2025-10-31 14:30:23.630847');
INSERT INTO public.notifications (id, user_id, type, title, message, related_user_id, related_id, is_read, read_at, created_at) VALUES (15, 11, 'peer_feedback_request', 'Запрос на оценку', 'Анна Сидорова запросил у вас peer review для периода "Полугодие 1 - 2025 (Анна)"', 10, 43, false, NULL, '2025-10-31 14:30:31.488119');
INSERT INTO public.notifications (id, user_id, type, title, message, related_user_id, related_id, is_read, read_at, created_at) VALUES (16, 7, 'peer_reviews_completed', 'Все peer отзывы получены', 'Анна Сидорова получил все peer отзывы для периода "Полугодие 1 - 2025 (Анна)". Можно переходить к оценке руководителя.', 10, NULL, false, NULL, '2025-10-31 14:34:00.175765');
INSERT INTO public.notifications (id, user_id, type, title, message, related_user_id, related_id, is_read, read_at, created_at) VALUES (17, 7, 'potential_assessment_ready', 'Готово к оценке потенциала', 'Анна Сидорова готов к оценке потенциала', 10, 24, false, NULL, '2025-10-31 14:35:58.385497');
INSERT INTO public.notifications (id, user_id, type, title, message, related_user_id, related_id, is_read, read_at, created_at) VALUES (18, 10, 'potential_assessment_submitted', 'Оценка потенциала завершена', 'Руководитель завершил оценку вашего потенциала. Ожидайте расчета итогов.', 7, NULL, false, NULL, '2025-10-31 14:36:36.517149');
INSERT INTO public.notifications (id, user_id, type, title, message, related_user_id, related_id, is_read, read_at, created_at) VALUES (19, 9, 'calculation_completed', 'Калькуляция завершена', 'Ваша оценка была рассчитана. Посмотрите результаты на дашборде.', 3, 13, false, NULL, '2025-10-31 17:10:21.349235');
INSERT INTO public.notifications (id, user_id, type, title, message, related_user_id, related_id, is_read, read_at, created_at) VALUES (20, 7, 'calculation_completed', 'Калькуляция завершена у сотрудника', 'Калькуляция завершена для сотрудника (periodId: 13).', 3, 13, false, NULL, '2025-10-31 17:10:21.353544');
INSERT INTO public.notifications (id, user_id, type, title, message, related_user_id, related_id, is_read, read_at, created_at) VALUES (21, 10, 'calculation_completed', 'Калькуляция завершена', 'Ваша оценка была рассчитана. Посмотрите результаты на дашборде.', 3, 24, false, NULL, '2025-10-31 17:22:54.897692');
INSERT INTO public.notifications (id, user_id, type, title, message, related_user_id, related_id, is_read, read_at, created_at) VALUES (22, 7, 'calculation_completed', 'Калькуляция завершена у сотрудника', 'Калькуляция завершена для сотрудника (periodId: 24).', 3, 24, false, NULL, '2025-10-31 17:22:54.902741');
INSERT INTO public.notifications (id, user_id, type, title, message, related_user_id, related_id, is_read, read_at, created_at) VALUES (1, 7, 'early_pr_request', 'Запрос раннего Performance Review', 'Анна Сидорова запросил ранний Performance Review', 10, 15, true, '2025-10-31 18:18:05.539514', '2025-10-30 16:18:16.215975');
INSERT INTO public.notifications (id, user_id, type, title, message, related_user_id, related_id, is_read, read_at, created_at) VALUES (2, 10, 'early_pr_rejected', 'Запрос на ранний PR отклонен', 'Руководитель отклонил ваш запрос. Причина: Ты не готова!', NULL, 15, true, '2025-10-31 18:18:05.539514', '2025-10-30 17:58:30.747966');
INSERT INTO public.notifications (id, user_id, type, title, message, related_user_id, related_id, is_read, read_at, created_at) VALUES (3, 7, 'early_pr_request', 'Запрос раннего Performance Review', 'Иван Иванов запросил ранний Performance Review', 9, 13, true, '2025-10-31 18:18:05.539514', '2025-10-30 17:59:13.601519');
INSERT INTO public.notifications (id, user_id, type, title, message, related_user_id, related_id, is_read, read_at, created_at) VALUES (4, 3, 'early_pr_hr_approval', 'Требуется утверждение раннего PR', 'Руководитель утвердил ранний PR для Иван Иванов', 9, 13, true, '2025-10-31 18:18:05.539514', '2025-10-30 17:59:37.707326');
INSERT INTO public.notifications (id, user_id, type, title, message, related_user_id, related_id, is_read, read_at, created_at) VALUES (5, 9, 'early_pr_approved', 'Ранний PR утвержден', 'Ваш запрос утвержден. Приступайте к самооценке и запросам обратной связи.', NULL, 13, true, '2025-10-31 18:18:05.539514', '2025-10-30 18:09:07.855103');
INSERT INTO public.notifications (id, user_id, type, title, message, related_user_id, related_id, is_read, read_at, created_at) VALUES (10, 7, 'early_pr_request', 'Запрос раннего Performance Review', 'Анна Сидорова запросил ранний Performance Review', 10, 24, true, '2025-10-31 18:18:05.539514', '2025-10-31 14:26:40.662692');
INSERT INTO public.notifications (id, user_id, type, title, message, related_user_id, related_id, is_read, read_at, created_at) VALUES (11, 3, 'early_pr_hr_approval', 'Требуется утверждение раннего PR', 'Руководитель утвердил ранний PR для Анна Сидорова', 10, 24, true, '2025-10-31 18:18:05.539514', '2025-10-31 14:26:49.178626');
INSERT INTO public.notifications (id, user_id, type, title, message, related_user_id, related_id, is_read, read_at, created_at) VALUES (12, 10, 'early_pr_approved', 'Ранний PR утвержден', 'Ваш запрос утвержден. Приступайте к самооценке и запросам обратной связи.', NULL, 24, true, '2025-10-31 18:18:05.539514', '2025-10-31 14:26:56.73981');


--
-- Data for Name: peer_feedback_requests; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.peer_feedback_requests (id, requester_id, reviewer_id, status, message, created_at, completed_at, period_id) VALUES (8, 9, 10, 'completed', NULL, '2025-10-30 15:26:44.154109', '2024-12-15 00:00:00', 16);
INSERT INTO public.peer_feedback_requests (id, requester_id, reviewer_id, status, message, created_at, completed_at, period_id) VALUES (9, 9, 11, 'completed', NULL, '2025-10-30 15:26:44.154109', '2024-12-15 00:00:00', 17);
INSERT INTO public.peer_feedback_requests (id, requester_id, reviewer_id, status, message, created_at, completed_at, period_id) VALUES (10, 9, 12, 'completed', NULL, '2025-10-30 15:26:44.154109', '2024-12-15 00:00:00', 19);
INSERT INTO public.peer_feedback_requests (id, requester_id, reviewer_id, status, message, created_at, completed_at, period_id) VALUES (40, 9, 10, 'completed', NULL, '2025-10-30 19:05:01.919311', '2025-10-30 19:09:50.730656', 13);
INSERT INTO public.peer_feedback_requests (id, requester_id, reviewer_id, status, message, created_at, completed_at, period_id) VALUES (39, 9, 8, 'completed', NULL, '2025-10-30 18:42:16.909825', '2025-10-30 19:40:29.558032', 13);
INSERT INTO public.peer_feedback_requests (id, requester_id, reviewer_id, status, message, created_at, completed_at, period_id) VALUES (38, 9, 13, 'completed', 'Привет! Оцени меня пожалуйста, мы с тобой работали вместе над проектом Wink PR', '2025-10-30 18:41:28.33873', '2025-10-30 19:41:30.27251', 13);
INSERT INTO public.peer_feedback_requests (id, requester_id, reviewer_id, status, message, created_at, completed_at, period_id) VALUES (42, 10, 9, 'completed', NULL, '2025-10-31 14:30:23.627855', '2025-10-31 14:32:08.220863', 24);
INSERT INTO public.peer_feedback_requests (id, requester_id, reviewer_id, status, message, created_at, completed_at, period_id) VALUES (43, 10, 11, 'completed', NULL, '2025-10-31 14:30:31.484679', '2025-10-31 14:33:11.333413', 24);
INSERT INTO public.peer_feedback_requests (id, requester_id, reviewer_id, status, message, created_at, completed_at, period_id) VALUES (41, 10, 13, 'completed', NULL, '2025-10-31 14:30:16.403974', '2025-10-31 14:34:00.171222', 24);


--
-- Data for Name: peer_feedbacks; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.peer_feedbacks (id, request_id, requester_id, reviewer_id, created_at, updated_at, result_achievement_rating, personal_qualities_comment, interaction_quality_rating, improvement_suggestions, period_id) VALUES (5, 40, 9, 10, '2025-10-30 19:09:50.721469', '2025-10-30 19:09:50.721469', 5, 'Упорство и наглость', 0, 'Быть внимательнее к коллегам. Ведет себя как царь!', 13);
INSERT INTO public.peer_feedbacks (id, request_id, requester_id, reviewer_id, created_at, updated_at, result_achievement_rating, personal_qualities_comment, interaction_quality_rating, improvement_suggestions, period_id) VALUES (6, 39, 9, 8, '2025-10-30 19:40:29.551655', '2025-10-30 19:40:29.551655', 7, 'Все нормально', 7, 'Улучшить коммуникативные  навыки', 13);
INSERT INTO public.peer_feedbacks (id, request_id, requester_id, reviewer_id, created_at, updated_at, result_achievement_rating, personal_qualities_comment, interaction_quality_rating, improvement_suggestions, period_id) VALUES (7, 38, 9, 13, '2025-10-30 19:41:30.265242', '2025-10-30 19:41:30.265242', 10, 'Всегда четко выполняет обязанности', 5, ' Иногда грубит во время горящих дедлайнов', 13);
INSERT INTO public.peer_feedbacks (id, request_id, requester_id, reviewer_id, created_at, updated_at, result_achievement_rating, personal_qualities_comment, interaction_quality_rating, improvement_suggestions, period_id) VALUES (8, 42, 10, 9, '2025-10-31 14:32:08.213877', '2025-10-31 14:32:08.213877', 9, 'Анна достигла 76% покрытия из запланированных 80%. Написала 127 unit-тестов и 34 integration-теста для всех критичных модулей. Результат близок к целевому показателю и превосходит начальное покрытие. Задача выполнена качественно и в сроки.', 10, 'На следующий период рекомендуется начинать писать тесты параллельно с разработкой, а не по завершении кода. Было бы полезно активнее участвовать в планировании и оценке временных затрат на тестирование уже в спринт-планировании. Также хорошо бы провести воркшоп для команды по best practices в тестировании.', 24);
INSERT INTO public.peer_feedbacks (id, request_id, requester_id, reviewer_id, created_at, updated_at, result_achievement_rating, personal_qualities_comment, interaction_quality_rating, improvement_suggestions, period_id) VALUES (9, 43, 10, 11, '2025-10-31 14:33:11.325469', '2025-10-31 14:33:11.325469', 4, 'Анна имеет хорошие технические навыки, но им не хватает системности. Работает волнами — то берется за задачу с полной отдачей, то теряет фокус. Не очень внимательна к деталям — тесты часто содержат copy-paste код без учета специфики модулей. Доверчива в общении, иногда берет обещания, которые не может выполнить.', 2, 'Необходимо развивать дисциплину и ответственность за качество. Рекомендуется более тщательно анализировать требования перед написанием тестов. Важно улучшить навыки коммуникации — вовремя сообщать об изменениях планов и потенциальных рисках. Стоит работать над способностью принимать конструктивную критику без личных обид.', 24);
INSERT INTO public.peer_feedbacks (id, request_id, requester_id, reviewer_id, created_at, updated_at, result_achievement_rating, personal_qualities_comment, interaction_quality_rating, improvement_suggestions, period_id) VALUES (10, 41, 10, 13, '2025-10-31 14:34:00.164228', '2025-10-31 14:34:00.164228', 10, 'Анна — образец профессионализма и внимательности. Обладает редким сочетанием технического мастерства и стратегического мышления. Её инициативность проявилась в проактивном внедрении CI/CD автоматизации, что ускорило работу всей команды. Настойчивость и целеустремленность позволяют ей не соглашаться на компромиссы по качеству. Это сотрудник, на которого можно полностью положиться.
', 10, 'Анна — образцовый командный игрок. Всегда открыта к диалогу, готова помочь коллегам разбираться в новых инструментах и подходах. Щедро делится своим опытом, ведёт knowledge-sharing сессии. Коммуникирует статус проекта прозрачно и своевременно. Её позитивный настрой и конструктивный подход вдохновляют всю команду.', 24);


--
-- Data for Name: peer_review_questions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.peer_review_questions (id, question_text, question_type, max_score, weight, is_active, display_order, created_at) VALUES (1, 'Эффективность совместной работы', 'scale_0_10', 10, 1.00, true, 1, '2025-10-24 15:03:39.498234');
INSERT INTO public.peer_review_questions (id, question_text, question_type, max_score, weight, is_active, display_order, created_at) VALUES (2, 'Готовность помогать коллегам', 'scale_0_10', 10, 1.00, true, 2, '2025-10-24 15:03:39.500192');
INSERT INTO public.peer_review_questions (id, question_text, question_type, max_score, weight, is_active, display_order, created_at) VALUES (3, 'Профессионализм', 'scale_0_10', 10, 1.00, true, 3, '2025-10-24 15:03:39.502142');
INSERT INTO public.peer_review_questions (id, question_text, question_type, max_score, weight, is_active, display_order, created_at) VALUES (4, 'Ответственность', 'scale_0_10', 10, 1.00, true, 4, '2025-10-24 15:03:39.504041');
INSERT INTO public.peer_review_questions (id, question_text, question_type, max_score, weight, is_active, display_order, created_at) VALUES (5, 'Конструктивность в общении', 'scale_0_10', 10, 1.00, true, 5, '2025-10-24 15:03:39.505534');


--
-- Data for Name: peer_reviews; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.peer_reviews (id, employee_id, respondent_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) VALUES (12, 7, 11, 2, 2, 1, 'Оценка коллеги по вопросу 1', 3, '2025-10-24 15:04:02.261497');
INSERT INTO public.peer_reviews (id, employee_id, respondent_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) VALUES (13, 7, 11, 2, 2, 2, 'Оценка коллеги по вопросу 2', 4, '2025-10-24 15:04:02.262988');
INSERT INTO public.peer_reviews (id, employee_id, respondent_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) VALUES (14, 7, 11, 2, 2, 3, 'Оценка коллеги по вопросу 3', 4, '2025-10-24 15:04:02.264462');
INSERT INTO public.peer_reviews (id, employee_id, respondent_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) VALUES (15, 7, 11, 2, 2, 4, 'Оценка коллеги по вопросу 4', 5, '2025-10-24 15:04:02.265411');
INSERT INTO public.peer_reviews (id, employee_id, respondent_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) VALUES (16, 7, 11, 2, 2, 5, 'Оценка коллеги по вопросу 5', 3, '2025-10-24 15:04:02.266446');
INSERT INTO public.peer_reviews (id, employee_id, respondent_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) VALUES (17, 8, 7, 2, 2, 1, 'Оценка коллеги по вопросу 1', 5, '2025-10-24 15:04:02.273174');
INSERT INTO public.peer_reviews (id, employee_id, respondent_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) VALUES (18, 8, 7, 2, 2, 2, 'Оценка коллеги по вопросу 2', 3, '2025-10-24 15:04:02.274194');
INSERT INTO public.peer_reviews (id, employee_id, respondent_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) VALUES (19, 8, 7, 2, 2, 3, 'Оценка коллеги по вопросу 3', 3, '2025-10-24 15:04:02.275541');
INSERT INTO public.peer_reviews (id, employee_id, respondent_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) VALUES (20, 8, 7, 2, 2, 4, 'Оценка коллеги по вопросу 4', 4, '2025-10-24 15:04:02.276859');
INSERT INTO public.peer_reviews (id, employee_id, respondent_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) VALUES (21, 8, 7, 2, 2, 5, 'Оценка коллеги по вопросу 5', 5, '2025-10-24 15:04:02.278788');
INSERT INTO public.peer_reviews (id, employee_id, respondent_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) VALUES (22, 9, 10, 3, 2, 1, 'Оценка коллеги по вопросу 1', 4, '2025-10-24 15:04:02.29642');
INSERT INTO public.peer_reviews (id, employee_id, respondent_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) VALUES (23, 9, 10, 3, 2, 2, 'Оценка коллеги по вопросу 2', 3, '2025-10-24 15:04:02.298119');
INSERT INTO public.peer_reviews (id, employee_id, respondent_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) VALUES (24, 9, 10, 3, 2, 3, 'Оценка коллеги по вопросу 3', 3, '2025-10-24 15:04:02.299163');
INSERT INTO public.peer_reviews (id, employee_id, respondent_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) VALUES (25, 9, 10, 3, 2, 4, 'Оценка коллеги по вопросу 4', 3, '2025-10-24 15:04:02.300219');
INSERT INTO public.peer_reviews (id, employee_id, respondent_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) VALUES (26, 9, 10, 3, 2, 5, 'Оценка коллеги по вопросу 5', 3, '2025-10-24 15:04:02.300997');
INSERT INTO public.peer_reviews (id, employee_id, respondent_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) VALUES (32, 11, 7, 1, 2, 1, 'Оценка коллеги по вопросу 1', 4, '2025-10-24 15:04:02.337641');
INSERT INTO public.peer_reviews (id, employee_id, respondent_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) VALUES (33, 11, 7, 1, 2, 2, 'Оценка коллеги по вопросу 2', 5, '2025-10-24 15:04:02.339383');
INSERT INTO public.peer_reviews (id, employee_id, respondent_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) VALUES (34, 11, 7, 1, 2, 3, 'Оценка коллеги по вопросу 3', 4, '2025-10-24 15:04:02.340893');
INSERT INTO public.peer_reviews (id, employee_id, respondent_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) VALUES (35, 11, 7, 1, 2, 4, 'Оценка коллеги по вопросу 4', 3, '2025-10-24 15:04:02.34244');
INSERT INTO public.peer_reviews (id, employee_id, respondent_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) VALUES (36, 11, 7, 1, 2, 5, 'Оценка коллеги по вопросу 5', 3, '2025-10-24 15:04:02.343455');
INSERT INTO public.peer_reviews (id, employee_id, respondent_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) VALUES (42, 13, 10, 3, 2, 1, 'Оценка коллеги по вопросу 1', 5, '2025-10-24 15:04:02.394089');
INSERT INTO public.peer_reviews (id, employee_id, respondent_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) VALUES (43, 13, 10, 3, 2, 2, 'Оценка коллеги по вопросу 2', 5, '2025-10-24 15:04:02.395773');
INSERT INTO public.peer_reviews (id, employee_id, respondent_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) VALUES (44, 13, 10, 3, 2, 3, 'Оценка коллеги по вопросу 3', 5, '2025-10-24 15:04:02.397255');
INSERT INTO public.peer_reviews (id, employee_id, respondent_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) VALUES (45, 13, 10, 3, 2, 4, 'Оценка коллеги по вопросу 4', 3, '2025-10-24 15:04:02.398783');
INSERT INTO public.peer_reviews (id, employee_id, respondent_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) VALUES (46, 13, 10, 3, 2, 5, 'Оценка коллеги по вопросу 5', 5, '2025-10-24 15:04:02.400627');


--
-- Data for Name: performance_review_status; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: potential_assessments; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.potential_assessments (id, employee_id, manager_id, cycle_id, prof_responsibility, prof_result_oriented, prof_proactivity, prof_open_mindset, prof_team_player, professional_comment, pers_took_responsibility, pers_transparent_communication, pers_shared_info, pers_organized_work, personal_comment, had_motivation_one_on_one, knows_miscommunication_cases, development_desire, is_successor, successor_ready_timing, turnover_risk, ole_priority_1, ole_priority_2, performance_raw_score, performance_final_score, potential_raw_score, potential_final_score, created_at, updated_at) VALUES (1, 9, 7, 1, true, true, true, true, false, '', false, true, false, false, '', false, false, 'proactive', false, '1-2_years', 6, 'Не понятно что тут писать ', '', 6, 2, 6, 1, '2025-10-30 21:25:12.919566', '2025-10-30 21:46:39.169038');
INSERT INTO public.potential_assessments (id, employee_id, manager_id, cycle_id, prof_responsibility, prof_result_oriented, prof_proactivity, prof_open_mindset, prof_team_player, professional_comment, pers_took_responsibility, pers_transparent_communication, pers_shared_info, pers_organized_work, personal_comment, had_motivation_one_on_one, knows_miscommunication_cases, development_desire, is_successor, successor_ready_timing, turnover_risk, ole_priority_1, ole_priority_2, performance_raw_score, performance_final_score, potential_raw_score, potential_final_score, created_at, updated_at) VALUES (2, 10, 7, 1, true, true, true, true, true, '', true, false, false, true, '', false, true, 'proactive', true, '1-2_years', 2, '', '', 5, 2, 10, 2, '2025-10-31 14:36:36.504821', '2025-10-31 14:36:36.504821');
INSERT INTO public.potential_assessments (id, employee_id, manager_id, cycle_id, prof_responsibility, prof_result_oriented, prof_proactivity, prof_open_mindset, prof_team_player, professional_comment, pers_took_responsibility, pers_transparent_communication, pers_shared_info, pers_organized_work, personal_comment, had_motivation_one_on_one, knows_miscommunication_cases, development_desire, is_successor, successor_ready_timing, turnover_risk, ole_priority_1, ole_priority_2, performance_raw_score, performance_final_score, potential_raw_score, potential_final_score, created_at, updated_at) VALUES (9, 7, 7, 2, true, true, true, false, true, 'Оценка потенциала на основе наблюдений и достижений', true, false, true, true, 'Демонстрирует стабильные результаты и готовность к развитию', true, false, 'Среднее', false, 'Через 1-2 года', 2, 'Развитие технических навыков', 'Улучшение коммуникаций', 6, 6, 5, 5, '2025-10-31 19:10:49.878852', '2025-10-31 19:10:49.878852');
INSERT INTO public.potential_assessments (id, employee_id, manager_id, cycle_id, prof_responsibility, prof_result_oriented, prof_proactivity, prof_open_mindset, prof_team_player, professional_comment, pers_took_responsibility, pers_transparent_communication, pers_shared_info, pers_organized_work, personal_comment, had_motivation_one_on_one, knows_miscommunication_cases, development_desire, is_successor, successor_ready_timing, turnover_risk, ole_priority_1, ole_priority_2, performance_raw_score, performance_final_score, potential_raw_score, potential_final_score, created_at, updated_at) VALUES (10, 9, 7, 2, true, true, true, true, true, 'Оценка потенциала на основе наблюдений и достижений', true, true, true, true, 'Демонстрирует стабильные результаты и готовность к развитию', true, false, 'Высокое', false, 'Через 1-2 года', 1, 'Развитие технических навыков', 'Улучшение коммуникаций', 8, 8, 6, 6, '2025-10-31 19:10:49.883399', '2025-10-31 19:10:49.883399');
INSERT INTO public.potential_assessments (id, employee_id, manager_id, cycle_id, prof_responsibility, prof_result_oriented, prof_proactivity, prof_open_mindset, prof_team_player, professional_comment, pers_took_responsibility, pers_transparent_communication, pers_shared_info, pers_organized_work, personal_comment, had_motivation_one_on_one, knows_miscommunication_cases, development_desire, is_successor, successor_ready_timing, turnover_risk, ole_priority_1, ole_priority_2, performance_raw_score, performance_final_score, potential_raw_score, potential_final_score, created_at, updated_at) VALUES (11, 10, 7, 2, true, true, true, true, true, 'Оценка потенциала на основе наблюдений и достижений', true, true, true, true, 'Демонстрирует стабильные результаты и готовность к развитию', true, false, 'Высокое', true, 'В течение года', 1, 'Развитие технических навыков', 'Улучшение коммуникаций', 9, 9, 7, 7, '2025-10-31 19:10:49.885699', '2025-10-31 19:10:49.885699');
INSERT INTO public.potential_assessments (id, employee_id, manager_id, cycle_id, prof_responsibility, prof_result_oriented, prof_proactivity, prof_open_mindset, prof_team_player, professional_comment, pers_took_responsibility, pers_transparent_communication, pers_shared_info, pers_organized_work, personal_comment, had_motivation_one_on_one, knows_miscommunication_cases, development_desire, is_successor, successor_ready_timing, turnover_risk, ole_priority_1, ole_priority_2, performance_raw_score, performance_final_score, potential_raw_score, potential_final_score, created_at, updated_at) VALUES (12, 11, 7, 2, true, true, true, true, true, 'Оценка потенциала на основе наблюдений и достижений', true, true, true, true, 'Демонстрирует стабильные результаты и готовность к развитию', true, false, 'Высокое', false, 'Через 1-2 года', 1, 'Развитие технических навыков', 'Улучшение коммуникаций', 7, 7, 6, 6, '2025-10-31 19:10:49.887858', '2025-10-31 19:10:49.887858');
INSERT INTO public.potential_assessments (id, employee_id, manager_id, cycle_id, prof_responsibility, prof_result_oriented, prof_proactivity, prof_open_mindset, prof_team_player, professional_comment, pers_took_responsibility, pers_transparent_communication, pers_shared_info, pers_organized_work, personal_comment, had_motivation_one_on_one, knows_miscommunication_cases, development_desire, is_successor, successor_ready_timing, turnover_risk, ole_priority_1, ole_priority_2, performance_raw_score, performance_final_score, potential_raw_score, potential_final_score, created_at, updated_at) VALUES (13, 12, 7, 2, true, true, true, false, true, 'Оценка потенциала на основе наблюдений и достижений', true, false, true, true, 'Демонстрирует стабильные результаты и готовность к развитию', true, false, 'Среднее', false, 'Через 1-2 года', 2, 'Развитие технических навыков', 'Улучшение коммуникаций', 5, 5, 5, 5, '2025-10-31 19:10:49.8902', '2025-10-31 19:10:49.8902');
INSERT INTO public.potential_assessments (id, employee_id, manager_id, cycle_id, prof_responsibility, prof_result_oriented, prof_proactivity, prof_open_mindset, prof_team_player, professional_comment, pers_took_responsibility, pers_transparent_communication, pers_shared_info, pers_organized_work, personal_comment, had_motivation_one_on_one, knows_miscommunication_cases, development_desire, is_successor, successor_ready_timing, turnover_risk, ole_priority_1, ole_priority_2, performance_raw_score, performance_final_score, potential_raw_score, potential_final_score, created_at, updated_at) VALUES (14, 13, 7, 2, false, false, false, false, false, 'Оценка потенциала на основе наблюдений и достижений', false, false, false, false, 'Демонстрирует стабильные результаты и готовность к развитию', true, true, 'Низкое', false, 'Через 2-3 года', 3, 'Развитие технических навыков', 'Улучшение коммуникаций', 3, 3, 3, 3, '2025-10-31 19:10:49.89238', '2025-10-31 19:10:49.89238');


--
-- Data for Name: potential_detail_answers; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: potential_detail_questions; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: recommendation_triggers; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: review_cycles; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.review_cycles (id, name, start_date, end_date, status, created_at) VALUES (1, 'Полугодие 1 - 2025', '2025-01-01', '2025-06-30', 'active', '2025-10-24 09:26:23.107702');
INSERT INTO public.review_cycles (id, name, start_date, end_date, status, created_at) VALUES (2, 'Полугодие 2 - 2025', '2025-07-01', '2025-12-31', 'active', '2025-10-24 09:29:58.134448');


--
-- Data for Name: review_periods; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.review_periods (id, name, start_date, end_date, is_active, created_at) VALUES (6, 'Полугодие 1 - 2025', '2025-01-01', '2025-06-30', false, '2025-10-24 18:22:22.527265');
INSERT INTO public.review_periods (id, name, start_date, end_date, is_active, created_at) VALUES (7, 'Полугодие 2 - 2025', '2025-07-01', '2025-12-31', true, '2025-10-24 18:22:22.527265');


--
-- Data for Name: selected_respondents; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: self_assessment_questions; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: self_assessments; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.self_assessments (id, user_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) VALUES (121, 7, 1, 2, 1, NULL, 3, '2025-10-24 13:26:55.110608');
INSERT INTO public.self_assessments (id, user_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) VALUES (122, 7, 1, 2, 2, NULL, 4, '2025-10-24 13:26:55.112161');
INSERT INTO public.self_assessments (id, user_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) VALUES (123, 7, 1, 2, 3, NULL, 4, '2025-10-24 13:26:55.113953');
INSERT INTO public.self_assessments (id, user_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) VALUES (124, 7, 1, 2, 4, NULL, 3, '2025-10-24 13:26:55.115051');
INSERT INTO public.self_assessments (id, user_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) VALUES (125, 7, 1, 2, 5, NULL, 4, '2025-10-24 13:26:55.115956');
INSERT INTO public.self_assessments (id, user_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) VALUES (126, 8, 1, 2, 1, NULL, 4, '2025-10-24 13:26:55.121498');
INSERT INTO public.self_assessments (id, user_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) VALUES (127, 8, 1, 2, 2, NULL, 4, '2025-10-24 13:26:55.122652');
INSERT INTO public.self_assessments (id, user_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) VALUES (128, 8, 1, 2, 3, NULL, 5, '2025-10-24 13:26:55.123983');
INSERT INTO public.self_assessments (id, user_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) VALUES (129, 8, 1, 2, 4, NULL, 4, '2025-10-24 13:26:55.124776');
INSERT INTO public.self_assessments (id, user_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) VALUES (130, 8, 1, 2, 5, NULL, 5, '2025-10-24 13:26:55.126164');
INSERT INTO public.self_assessments (id, user_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) VALUES (131, 9, 1, 2, 1, NULL, 3, '2025-10-24 13:26:55.128432');
INSERT INTO public.self_assessments (id, user_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) VALUES (132, 9, 1, 2, 2, NULL, 3, '2025-10-24 13:26:55.129761');
INSERT INTO public.self_assessments (id, user_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) VALUES (133, 9, 1, 2, 3, NULL, 3, '2025-10-24 13:26:55.130768');
INSERT INTO public.self_assessments (id, user_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) VALUES (134, 9, 1, 2, 4, NULL, 5, '2025-10-24 13:26:55.131964');
INSERT INTO public.self_assessments (id, user_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) VALUES (135, 9, 1, 2, 5, NULL, 5, '2025-10-24 13:26:55.132986');
INSERT INTO public.self_assessments (id, user_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) VALUES (136, 10, 1, 2, 1, NULL, 4, '2025-10-24 13:26:55.134976');
INSERT INTO public.self_assessments (id, user_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) VALUES (137, 10, 1, 2, 2, NULL, 5, '2025-10-24 13:26:55.135975');
INSERT INTO public.self_assessments (id, user_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) VALUES (138, 10, 1, 2, 3, NULL, 5, '2025-10-24 13:26:55.137034');
INSERT INTO public.self_assessments (id, user_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) VALUES (139, 10, 1, 2, 4, NULL, 3, '2025-10-24 13:26:55.138127');
INSERT INTO public.self_assessments (id, user_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) VALUES (140, 10, 1, 2, 5, NULL, 4, '2025-10-24 13:26:55.138865');
INSERT INTO public.self_assessments (id, user_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) VALUES (141, 11, 1, 2, 1, NULL, 4, '2025-10-24 13:26:55.140918');
INSERT INTO public.self_assessments (id, user_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) VALUES (142, 11, 1, 2, 2, NULL, 3, '2025-10-24 13:26:55.14258');
INSERT INTO public.self_assessments (id, user_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) VALUES (143, 11, 1, 2, 3, NULL, 4, '2025-10-24 13:26:55.144109');
INSERT INTO public.self_assessments (id, user_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) VALUES (144, 11, 1, 2, 4, NULL, 4, '2025-10-24 13:26:55.145378');
INSERT INTO public.self_assessments (id, user_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) VALUES (145, 11, 1, 2, 5, NULL, 5, '2025-10-24 13:26:55.146716');
INSERT INTO public.self_assessments (id, user_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) VALUES (146, 12, 1, 2, 1, NULL, 3, '2025-10-24 13:26:55.150047');
INSERT INTO public.self_assessments (id, user_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) VALUES (147, 12, 1, 2, 2, NULL, 5, '2025-10-24 13:26:55.151444');
INSERT INTO public.self_assessments (id, user_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) VALUES (148, 12, 1, 2, 3, NULL, 5, '2025-10-24 13:26:55.152561');
INSERT INTO public.self_assessments (id, user_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) VALUES (149, 12, 1, 2, 4, NULL, 5, '2025-10-24 13:26:55.153677');
INSERT INTO public.self_assessments (id, user_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) VALUES (150, 12, 1, 2, 5, NULL, 4, '2025-10-24 13:26:55.154845');
INSERT INTO public.self_assessments (id, user_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) VALUES (153, 9, 1, 1, 1, 'Я успешно завершил все запланированные задачи. Реализовал новую функциональность для системы Performance Review, улучшил производительность на 30%.', 8, '2025-10-30 20:02:18.10424');
INSERT INTO public.self_assessments (id, user_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) VALUES (154, 9, 1, 1, 2, 'Активно взаимодействовал с командой, проводил code review, помогал коллегам разбираться со сложными задачами.', 7, '2025-10-30 20:02:18.11338');
INSERT INTO public.self_assessments (id, user_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) VALUES (155, 9, 1, 1, 3, 'Изучил новые технологии React и Node.js, применил их в проекте. Прошел курс по архитектуре приложений.', 8, '2025-10-30 20:02:18.115456');
INSERT INTO public.self_assessments (id, user_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) VALUES (156, 9, 1, 1, 4, 'Хочу развиваться в направлении архитектуры систем, изучить микросервисы и cloud-технологии.', NULL, '2025-10-30 20:02:18.117852');
INSERT INTO public.self_assessments (id, user_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) VALUES (157, 13, 1, 2, 1, 'Выполняю задачи на среднем уровне', 3, '2025-10-31 20:07:36.751392');
INSERT INTO public.self_assessments (id, user_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) VALUES (158, 13, 1, 2, 2, 'Выполняю задачи на среднем уровне', 3, '2025-10-31 20:07:36.759018');
INSERT INTO public.self_assessments (id, user_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) VALUES (159, 13, 1, 2, 3, 'Выполняю задачи на среднем уровне', 3, '2025-10-31 20:07:36.761342');
INSERT INTO public.self_assessments (id, user_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) VALUES (160, 13, 1, 2, 4, 'Выполняю задачи на среднем уровне', 3, '2025-10-31 20:07:36.76329');
INSERT INTO public.self_assessments (id, user_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) VALUES (161, 13, 1, 2, 5, 'Выполняю задачи на среднем уровне', 3, '2025-10-31 20:07:36.765091');


--
-- Data for Name: task_annotations; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: task_leads; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: task_participants; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.tasks (id, legacy_number, name, description, department, owning_unit, status, notes, created_at, updated_at) VALUES (1, NULL, 'Интеграция Белтелекома', 'Разработка РИТ', 'Разработка', NULL, 'active', NULL, '2025-10-24 09:26:34.352552', '2025-10-24 09:26:34.352552');
INSERT INTO public.tasks (id, legacy_number, name, description, department, owning_unit, status, notes, created_at, updated_at) VALUES (2, NULL, 'Повышение конверсии', 'Оплата с карточки проекта', 'Продукт', NULL, 'active', NULL, '2025-10-24 09:26:34.352552', '2025-10-24 09:26:34.352552');
INSERT INTO public.tasks (id, legacy_number, name, description, department, owning_unit, status, notes, created_at, updated_at) VALUES (3, NULL, 'Главная на своих скрингридах', 'Обновление главной страницы', 'Дизайн', NULL, 'active', NULL, '2025-10-24 09:26:34.352552', '2025-10-24 09:26:34.352552');


--
-- Data for Name: user_review_periods; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.user_review_periods (id, user_id, cycle_id, start_date, end_date, notification_sent, reminder_sent, status, created_at, updated_at) VALUES (11, 9, 2, '2025-10-20', '2025-11-05', true, false, 'in_progress', '2025-10-24 16:49:51.485634', '2025-10-24 16:49:51.485634');
INSERT INTO public.user_review_periods (id, user_id, cycle_id, start_date, end_date, notification_sent, reminder_sent, status, created_at, updated_at) VALUES (12, 10, 2, '2025-10-22', '2025-11-10', true, false, 'in_progress', '2025-10-24 16:49:51.495963', '2025-10-24 16:49:51.495963');
INSERT INTO public.user_review_periods (id, user_id, cycle_id, start_date, end_date, notification_sent, reminder_sent, status, created_at, updated_at) VALUES (14, 11, 2, '2025-10-01', '2025-10-15', true, false, 'completed', '2025-10-24 16:49:51.502161', '2025-10-24 16:49:51.502161');
INSERT INTO public.user_review_periods (id, user_id, cycle_id, start_date, end_date, notification_sent, reminder_sent, status, created_at, updated_at) VALUES (15, 12, 2, '2025-11-01', '2025-11-15', false, false, 'pending', '2025-10-24 16:49:51.506358', '2025-10-24 16:49:51.506358');
INSERT INTO public.user_review_periods (id, user_id, cycle_id, start_date, end_date, notification_sent, reminder_sent, status, created_at, updated_at) VALUES (16, 13, 2, '2025-11-05', '2025-11-20', false, false, 'pending', '2025-10-24 16:49:51.510367', '2025-10-24 16:49:51.510367');
INSERT INTO public.user_review_periods (id, user_id, cycle_id, start_date, end_date, notification_sent, reminder_sent, status, created_at, updated_at) VALUES (18, 7, 2, '2025-11-05', '2025-11-20', false, false, 'pending', '2025-10-24 16:49:51.516051', '2025-10-24 16:49:51.516051');
INSERT INTO public.user_review_periods (id, user_id, cycle_id, start_date, end_date, notification_sent, reminder_sent, status, created_at, updated_at) VALUES (19, 8, 2, '2025-11-10', '2025-11-25', false, false, 'pending', '2025-10-24 16:49:51.519562', '2025-10-24 16:49:51.519562');


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.users (id, email, password_hash, first_name, last_name, role, department, "position", manager_id, is_active, created_at, updated_at, hire_date) VALUES (3, 'hr@wink.ru', '$2a$10$0kGuHzfv0Y47H0QW5rFkfOTM1liYdLYSvj8/WXTMa1.BU4F8EC7im', 'Мария', 'Сидорова', 'hr', 'HR', 'HR Manager', NULL, true, '2025-10-24 09:26:11.811493', '2025-10-24 09:26:11.811493', NULL);
INSERT INTO public.users (id, email, password_hash, first_name, last_name, role, department, "position", manager_id, is_active, created_at, updated_at, hire_date) VALUES (4, 'admin@wink.ru', '$2a$10$0kGuHzfv0Y47H0QW5rFkfOTM1liYdLYSvj8/WXTMa1.BU4F8EC7im', 'Алексей', 'Смирнов', 'admin', 'IT', 'System Administrator', NULL, true, '2025-10-24 09:26:11.811493', '2025-10-24 09:26:11.811493', NULL);
INSERT INTO public.users (id, email, password_hash, first_name, last_name, role, department, "position", manager_id, is_active, created_at, updated_at, hire_date) VALUES (7, 'manager1@wink.ru', '$2a$10$0kGuHzfv0Y47H0QW5rFkfOTM1liYdLYSvj8/WXTMa1.BU4F8EC7im', 'Кирилл', 'Менеджеров', 'manager', 'Разработка', 'Team Lead', NULL, true, '2025-10-24 09:29:58.121543', '2025-10-24 09:29:58.121543', NULL);
INSERT INTO public.users (id, email, password_hash, first_name, last_name, role, department, "position", manager_id, is_active, created_at, updated_at, hire_date) VALUES (8, 'manager2@wink.ru', '$2a$10$0kGuHzfv0Y47H0QW5rFkfOTM1liYdLYSvj8/WXTMa1.BU4F8EC7im', 'Мария', 'Петрова', 'manager', 'Маркетинг', 'Marketing Manager', NULL, true, '2025-10-24 09:29:58.121543', '2025-10-24 09:29:58.121543', NULL);
INSERT INTO public.users (id, email, password_hash, first_name, last_name, role, department, "position", manager_id, is_active, created_at, updated_at, hire_date) VALUES (9, 'emp1@wink.ru', '$2a$10$0kGuHzfv0Y47H0QW5rFkfOTM1liYdLYSvj8/WXTMa1.BU4F8EC7im', 'Иван', 'Иванов', 'employee', 'Разработка', 'Senior Developer', 7, true, '2025-10-24 09:29:58.121543', '2025-10-24 09:29:58.121543', '2024-06-15');
INSERT INTO public.users (id, email, password_hash, first_name, last_name, role, department, "position", manager_id, is_active, created_at, updated_at, hire_date) VALUES (10, 'emp2@wink.ru', '$2a$10$0kGuHzfv0Y47H0QW5rFkfOTM1liYdLYSvj8/WXTMa1.BU4F8EC7im', 'Анна', 'Сидорова', 'employee', 'Разработка', 'Middle Developer', 7, true, '2025-10-24 09:29:58.121543', '2025-10-24 09:29:58.121543', '2024-01-10');
INSERT INTO public.users (id, email, password_hash, first_name, last_name, role, department, "position", manager_id, is_active, created_at, updated_at, hire_date) VALUES (11, 'emp3@wink.ru', '$2a$10$0kGuHzfv0Y47H0QW5rFkfOTM1liYdLYSvj8/WXTMa1.BU4F8EC7im', 'Петр', 'Петров', 'employee', 'Разработка', 'Junior Developer', 7, true, '2025-10-24 09:29:58.121543', '2025-10-24 09:29:58.121543', '2024-08-01');
INSERT INTO public.users (id, email, password_hash, first_name, last_name, role, department, "position", manager_id, is_active, created_at, updated_at, hire_date) VALUES (12, 'emp4@wink.ru', '$2a$10$0kGuHzfv0Y47H0QW5rFkfOTM1liYdLYSvj8/WXTMa1.BU4F8EC7im', 'Ольга', 'Васильева', 'employee', 'Маркетинг', 'Marketing Specialist', 8, true, '2025-10-24 09:29:58.121543', '2025-10-24 09:29:58.121543', '2024-04-20');
INSERT INTO public.users (id, email, password_hash, first_name, last_name, role, department, "position", manager_id, is_active, created_at, updated_at, hire_date) VALUES (13, 'emp5@wink.ru', '$2a$10$0kGuHzfv0Y47H0QW5rFkfOTM1liYdLYSvj8/WXTMa1.BU4F8EC7im', 'Дмитрий', 'Смирнов', 'employee', 'Маркетинг', 'Content Manager', 8, true, '2025-10-24 09:29:58.121543', '2025-10-24 09:29:58.121543', '2024-09-05');


--
-- Name: company_triggers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.company_triggers_id_seq', 10, true);


--
-- Name: employee_goals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.employee_goals_id_seq', 12, true);


--
-- Name: employee_recommendations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.employee_recommendations_id_seq', 10, true);


--
-- Name: employee_review_periods_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.employee_review_periods_id_seq', 33, true);


--
-- Name: employee_summaries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.employee_summaries_id_seq', 1, true);


--
-- Name: employee_tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.employee_tasks_id_seq', 1, false);


--
-- Name: final_reviews_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.final_reviews_id_seq', 1, false);


--
-- Name: form_sections_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.form_sections_id_seq', 1, false);


--
-- Name: form_static_blocks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.form_static_blocks_id_seq', 1, false);


--
-- Name: form_templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.form_templates_id_seq', 1, false);


--
-- Name: goal_tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.goal_tasks_id_seq', 3, true);


--
-- Name: manager_evaluations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.manager_evaluations_id_seq', 32, true);


--
-- Name: manager_recommendations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.manager_recommendations_id_seq', 7, true);


--
-- Name: manager_review_questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.manager_review_questions_id_seq', 6, true);


--
-- Name: manager_reviews_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.manager_reviews_id_seq', 30, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notifications_id_seq', 22, true);


--
-- Name: peer_feedback_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.peer_feedback_requests_id_seq', 43, true);


--
-- Name: peer_feedbacks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.peer_feedbacks_id_seq', 10, true);


--
-- Name: peer_review_questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.peer_review_questions_id_seq', 5, true);


--
-- Name: peer_reviews_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.peer_reviews_id_seq', 46, true);


--
-- Name: performance_review_status_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.performance_review_status_id_seq', 12, true);


--
-- Name: potential_assessments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.potential_assessments_id_seq', 14, true);


--
-- Name: potential_detail_answers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.potential_detail_answers_id_seq', 1, false);


--
-- Name: potential_detail_questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.potential_detail_questions_id_seq', 1, false);


--
-- Name: recommendation_triggers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.recommendation_triggers_id_seq', 1, false);


--
-- Name: review_cycles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.review_cycles_id_seq', 2, true);


--
-- Name: review_periods_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.review_periods_id_seq', 7, true);


--
-- Name: selected_respondents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.selected_respondents_id_seq', 1, false);


--
-- Name: self_assessment_questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.self_assessment_questions_id_seq', 1, false);


--
-- Name: self_assessments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.self_assessments_id_seq', 161, true);


--
-- Name: task_annotations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.task_annotations_id_seq', 1, false);


--
-- Name: task_leads_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.task_leads_id_seq', 1, false);


--
-- Name: task_participants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.task_participants_id_seq', 1, false);


--
-- Name: tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tasks_id_seq', 3, true);


--
-- Name: user_review_periods_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_review_periods_id_seq', 19, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 13, true);


--
-- Name: company_triggers company_triggers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_triggers
    ADD CONSTRAINT company_triggers_pkey PRIMARY KEY (id);


--
-- Name: company_triggers company_triggers_word_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_triggers
    ADD CONSTRAINT company_triggers_word_key UNIQUE (word);


--
-- Name: employee_goals employee_goals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_goals
    ADD CONSTRAINT employee_goals_pkey PRIMARY KEY (id);


--
-- Name: employee_goals employee_goals_user_id_cycle_id_goal_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_goals
    ADD CONSTRAINT employee_goals_user_id_cycle_id_goal_number_key UNIQUE (user_id, cycle_id, goal_number);


--
-- Name: employee_recommendations employee_recommendations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_recommendations
    ADD CONSTRAINT employee_recommendations_pkey PRIMARY KEY (id);


--
-- Name: employee_review_periods employee_review_periods_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_review_periods
    ADD CONSTRAINT employee_review_periods_pkey PRIMARY KEY (id);


--
-- Name: employee_review_periods employee_review_periods_user_id_start_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_review_periods
    ADD CONSTRAINT employee_review_periods_user_id_start_date_key UNIQUE (user_id, start_date);


--
-- Name: employee_summaries employee_summaries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_summaries
    ADD CONSTRAINT employee_summaries_pkey PRIMARY KEY (id);


--
-- Name: employee_tasks employee_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_tasks
    ADD CONSTRAINT employee_tasks_pkey PRIMARY KEY (id);


--
-- Name: employee_tasks employee_tasks_user_id_cycle_id_task_order_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_tasks
    ADD CONSTRAINT employee_tasks_user_id_cycle_id_task_order_key UNIQUE (user_id, cycle_id, task_order);


--
-- Name: final_reviews final_reviews_employee_id_cycle_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.final_reviews
    ADD CONSTRAINT final_reviews_employee_id_cycle_id_key UNIQUE (employee_id, cycle_id);


--
-- Name: final_reviews final_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.final_reviews
    ADD CONSTRAINT final_reviews_pkey PRIMARY KEY (id);


--
-- Name: form_sections form_sections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_sections
    ADD CONSTRAINT form_sections_pkey PRIMARY KEY (id);


--
-- Name: form_static_blocks form_static_blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_static_blocks
    ADD CONSTRAINT form_static_blocks_pkey PRIMARY KEY (id);


--
-- Name: form_templates form_templates_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_templates
    ADD CONSTRAINT form_templates_code_key UNIQUE (code);


--
-- Name: form_templates form_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_templates
    ADD CONSTRAINT form_templates_pkey PRIMARY KEY (id);


--
-- Name: goal_tasks goal_tasks_goal_id_task_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goal_tasks
    ADD CONSTRAINT goal_tasks_goal_id_task_number_key UNIQUE (goal_id, task_number);


--
-- Name: goal_tasks goal_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goal_tasks
    ADD CONSTRAINT goal_tasks_pkey PRIMARY KEY (id);


--
-- Name: manager_evaluations manager_evaluations_employee_id_manager_id_cycle_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manager_evaluations
    ADD CONSTRAINT manager_evaluations_employee_id_manager_id_cycle_id_key UNIQUE (employee_id, manager_id, cycle_id);


--
-- Name: manager_evaluations manager_evaluations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manager_evaluations
    ADD CONSTRAINT manager_evaluations_pkey PRIMARY KEY (id);


--
-- Name: manager_recommendations manager_recommendations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manager_recommendations
    ADD CONSTRAINT manager_recommendations_pkey PRIMARY KEY (id);


--
-- Name: manager_review_questions manager_review_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manager_review_questions
    ADD CONSTRAINT manager_review_questions_pkey PRIMARY KEY (id);


--
-- Name: manager_reviews manager_reviews_employee_id_task_id_cycle_id_question_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manager_reviews
    ADD CONSTRAINT manager_reviews_employee_id_task_id_cycle_id_question_id_key UNIQUE (employee_id, task_id, cycle_id, question_id);


--
-- Name: manager_reviews manager_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manager_reviews
    ADD CONSTRAINT manager_reviews_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: peer_feedback_requests peer_feedback_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.peer_feedback_requests
    ADD CONSTRAINT peer_feedback_requests_pkey PRIMARY KEY (id);


--
-- Name: peer_feedbacks peer_feedbacks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.peer_feedbacks
    ADD CONSTRAINT peer_feedbacks_pkey PRIMARY KEY (id);


--
-- Name: peer_review_questions peer_review_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.peer_review_questions
    ADD CONSTRAINT peer_review_questions_pkey PRIMARY KEY (id);


--
-- Name: peer_reviews peer_reviews_employee_id_respondent_id_task_id_cycle_id_que_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.peer_reviews
    ADD CONSTRAINT peer_reviews_employee_id_respondent_id_task_id_cycle_id_que_key UNIQUE (employee_id, respondent_id, task_id, cycle_id, question_id);


--
-- Name: peer_reviews peer_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.peer_reviews
    ADD CONSTRAINT peer_reviews_pkey PRIMARY KEY (id);


--
-- Name: performance_review_status performance_review_status_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.performance_review_status
    ADD CONSTRAINT performance_review_status_pkey PRIMARY KEY (id);


--
-- Name: performance_review_status performance_review_status_user_id_period_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.performance_review_status
    ADD CONSTRAINT performance_review_status_user_id_period_id_key UNIQUE (user_id, period_id);


--
-- Name: potential_assessments potential_assessments_employee_id_cycle_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.potential_assessments
    ADD CONSTRAINT potential_assessments_employee_id_cycle_id_key UNIQUE (employee_id, cycle_id);


--
-- Name: potential_assessments potential_assessments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.potential_assessments
    ADD CONSTRAINT potential_assessments_pkey PRIMARY KEY (id);


--
-- Name: potential_detail_answers potential_detail_answers_assessment_id_question_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.potential_detail_answers
    ADD CONSTRAINT potential_detail_answers_assessment_id_question_id_key UNIQUE (assessment_id, question_id);


--
-- Name: potential_detail_answers potential_detail_answers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.potential_detail_answers
    ADD CONSTRAINT potential_detail_answers_pkey PRIMARY KEY (id);


--
-- Name: potential_detail_questions potential_detail_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.potential_detail_questions
    ADD CONSTRAINT potential_detail_questions_pkey PRIMARY KEY (id);


--
-- Name: recommendation_triggers recommendation_triggers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recommendation_triggers
    ADD CONSTRAINT recommendation_triggers_pkey PRIMARY KEY (id);


--
-- Name: review_cycles review_cycles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_cycles
    ADD CONSTRAINT review_cycles_pkey PRIMARY KEY (id);


--
-- Name: review_periods review_periods_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_periods
    ADD CONSTRAINT review_periods_pkey PRIMARY KEY (id);


--
-- Name: selected_respondents selected_respondents_employee_id_respondent_id_task_id_cycl_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selected_respondents
    ADD CONSTRAINT selected_respondents_employee_id_respondent_id_task_id_cycl_key UNIQUE (employee_id, respondent_id, task_id, cycle_id);


--
-- Name: selected_respondents selected_respondents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selected_respondents
    ADD CONSTRAINT selected_respondents_pkey PRIMARY KEY (id);


--
-- Name: self_assessment_questions self_assessment_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.self_assessment_questions
    ADD CONSTRAINT self_assessment_questions_pkey PRIMARY KEY (id);


--
-- Name: self_assessments self_assessments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.self_assessments
    ADD CONSTRAINT self_assessments_pkey PRIMARY KEY (id);


--
-- Name: self_assessments self_assessments_user_id_task_id_cycle_id_question_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.self_assessments
    ADD CONSTRAINT self_assessments_user_id_task_id_cycle_id_question_id_key UNIQUE (user_id, task_id, cycle_id, question_id);


--
-- Name: task_annotations task_annotations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_annotations
    ADD CONSTRAINT task_annotations_pkey PRIMARY KEY (id);


--
-- Name: task_leads task_leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_leads
    ADD CONSTRAINT task_leads_pkey PRIMARY KEY (id);


--
-- Name: task_leads task_leads_task_id_full_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_leads
    ADD CONSTRAINT task_leads_task_id_full_name_key UNIQUE (task_id, full_name);


--
-- Name: task_participants task_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_participants
    ADD CONSTRAINT task_participants_pkey PRIMARY KEY (id);


--
-- Name: task_participants task_participants_task_id_full_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_participants
    ADD CONSTRAINT task_participants_task_id_full_name_key UNIQUE (task_id, full_name);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: user_review_periods user_review_periods_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_review_periods
    ADD CONSTRAINT user_review_periods_pkey PRIMARY KEY (id);


--
-- Name: user_review_periods user_review_periods_user_id_cycle_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_review_periods
    ADD CONSTRAINT user_review_periods_user_id_cycle_id_key UNIQUE (user_id, cycle_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_employee_recommendations_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employee_recommendations_employee ON public.employee_recommendations USING btree (employee_id);


--
-- Name: idx_employee_tasks_cycle; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employee_tasks_cycle ON public.employee_tasks USING btree (cycle_id);


--
-- Name: idx_employee_tasks_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employee_tasks_user ON public.employee_tasks USING btree (user_id);


--
-- Name: idx_final_review_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_final_review_employee ON public.final_reviews USING btree (employee_id);


--
-- Name: idx_final_review_rating; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_final_review_rating ON public.final_reviews USING btree (rating_category);


--
-- Name: idx_goal_tasks_goal; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_goal_tasks_goal ON public.goal_tasks USING btree (goal_id);


--
-- Name: idx_goals_cycle; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_goals_cycle ON public.employee_goals USING btree (cycle_id);


--
-- Name: idx_goals_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_goals_user ON public.employee_goals USING btree (user_id);


--
-- Name: idx_manager_eval_cycle; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_manager_eval_cycle ON public.manager_evaluations USING btree (cycle_id);


--
-- Name: idx_manager_eval_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_manager_eval_employee ON public.manager_evaluations USING btree (employee_id);


--
-- Name: idx_manager_eval_manager; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_manager_eval_manager ON public.manager_evaluations USING btree (manager_id);


--
-- Name: idx_manager_evaluations_cycle; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_manager_evaluations_cycle ON public.manager_evaluations USING btree (cycle_id);


--
-- Name: idx_manager_evaluations_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_manager_evaluations_employee ON public.manager_evaluations USING btree (employee_id);


--
-- Name: idx_manager_evaluations_manager; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_manager_evaluations_manager ON public.manager_evaluations USING btree (manager_id);


--
-- Name: idx_manager_recommendations_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_manager_recommendations_employee ON public.manager_recommendations USING btree (employee_id);


--
-- Name: idx_manager_recommendations_manager; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_manager_recommendations_manager ON public.manager_recommendations USING btree (manager_id);


--
-- Name: idx_manager_review_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_manager_review_employee ON public.manager_reviews USING btree (employee_id);


--
-- Name: idx_manager_review_manager; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_manager_review_manager ON public.manager_reviews USING btree (manager_id);


--
-- Name: idx_notifications_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (created_at);


--
-- Name: idx_notifications_is_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_is_read ON public.notifications USING btree (is_read);


--
-- Name: idx_notifications_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_type ON public.notifications USING btree (type);


--
-- Name: idx_notifications_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);


--
-- Name: idx_peer_review_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_peer_review_employee ON public.peer_reviews USING btree (employee_id);


--
-- Name: idx_peer_review_respondent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_peer_review_respondent ON public.peer_reviews USING btree (respondent_id);


--
-- Name: idx_potential_answers_assessment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_potential_answers_assessment ON public.potential_detail_answers USING btree (assessment_id);


--
-- Name: idx_pr_status_period_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pr_status_period_id ON public.performance_review_status USING btree (period_id);


--
-- Name: idx_pr_status_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pr_status_status ON public.performance_review_status USING btree (status);


--
-- Name: idx_pr_status_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pr_status_user_id ON public.performance_review_status USING btree (user_id);


--
-- Name: idx_respondents_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_respondents_employee ON public.selected_respondents USING btree (employee_id);


--
-- Name: idx_respondents_respondent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_respondents_respondent ON public.selected_respondents USING btree (respondent_id);


--
-- Name: idx_self_assessment_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_self_assessment_user ON public.self_assessments USING btree (user_id);


--
-- Name: idx_tasks_department; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_department ON public.tasks USING btree (department);


--
-- Name: idx_tasks_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_status ON public.tasks USING btree (status);


--
-- Name: idx_triggers_word; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_triggers_word ON public.recommendation_triggers USING btree (trigger_word);


--
-- Name: idx_user_review_periods_cycle_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_review_periods_cycle_id ON public.user_review_periods USING btree (cycle_id);


--
-- Name: idx_user_review_periods_dates; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_review_periods_dates ON public.user_review_periods USING btree (start_date, end_date);


--
-- Name: idx_user_review_periods_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_review_periods_status ON public.user_review_periods USING btree (status);


--
-- Name: idx_user_review_periods_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_review_periods_user_id ON public.user_review_periods USING btree (user_id);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_manager; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_manager ON public.users USING btree (manager_id);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- Name: peer_feedback_requests_unique_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX peer_feedback_requests_unique_idx ON public.peer_feedback_requests USING btree (requester_id, reviewer_id, period_id);


--
-- Name: employee_goals employee_goals_cycle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_goals
    ADD CONSTRAINT employee_goals_cycle_id_fkey FOREIGN KEY (cycle_id) REFERENCES public.review_cycles(id);


--
-- Name: employee_goals employee_goals_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_goals
    ADD CONSTRAINT employee_goals_period_id_fkey FOREIGN KEY (period_id) REFERENCES public.employee_review_periods(id) ON DELETE CASCADE;


--
-- Name: employee_goals employee_goals_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_goals
    ADD CONSTRAINT employee_goals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: employee_recommendations employee_recommendations_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_recommendations
    ADD CONSTRAINT employee_recommendations_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: employee_recommendations employee_recommendations_hr_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_recommendations
    ADD CONSTRAINT employee_recommendations_hr_id_fkey FOREIGN KEY (hr_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: employee_review_periods employee_review_periods_cycle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_review_periods
    ADD CONSTRAINT employee_review_periods_cycle_id_fkey FOREIGN KEY (cycle_id) REFERENCES public.review_cycles(id);


--
-- Name: employee_review_periods employee_review_periods_hr_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_review_periods
    ADD CONSTRAINT employee_review_periods_hr_approved_by_fkey FOREIGN KEY (hr_approved_by) REFERENCES public.users(id);


--
-- Name: employee_review_periods employee_review_periods_manager_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_review_periods
    ADD CONSTRAINT employee_review_periods_manager_approved_by_fkey FOREIGN KEY (manager_approved_by) REFERENCES public.users(id);


--
-- Name: employee_review_periods employee_review_periods_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_review_periods
    ADD CONSTRAINT employee_review_periods_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: employee_summaries employee_summaries_cycle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_summaries
    ADD CONSTRAINT employee_summaries_cycle_id_fkey FOREIGN KEY (cycle_id) REFERENCES public.review_cycles(id);


--
-- Name: employee_summaries employee_summaries_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_summaries
    ADD CONSTRAINT employee_summaries_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.users(id);


--
-- Name: employee_tasks employee_tasks_cycle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_tasks
    ADD CONSTRAINT employee_tasks_cycle_id_fkey FOREIGN KEY (cycle_id) REFERENCES public.review_cycles(id);


--
-- Name: employee_tasks employee_tasks_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_tasks
    ADD CONSTRAINT employee_tasks_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id);


--
-- Name: employee_tasks employee_tasks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_tasks
    ADD CONSTRAINT employee_tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: final_reviews final_reviews_cycle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.final_reviews
    ADD CONSTRAINT final_reviews_cycle_id_fkey FOREIGN KEY (cycle_id) REFERENCES public.review_cycles(id);


--
-- Name: final_reviews final_reviews_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.final_reviews
    ADD CONSTRAINT final_reviews_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.users(id);


--
-- Name: form_sections form_sections_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_sections
    ADD CONSTRAINT form_sections_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.form_templates(id) ON DELETE CASCADE;


--
-- Name: form_static_blocks form_static_blocks_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_static_blocks
    ADD CONSTRAINT form_static_blocks_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.form_sections(id) ON DELETE CASCADE;


--
-- Name: form_static_blocks form_static_blocks_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_static_blocks
    ADD CONSTRAINT form_static_blocks_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.form_templates(id) ON DELETE CASCADE;


--
-- Name: goal_tasks goal_tasks_goal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goal_tasks
    ADD CONSTRAINT goal_tasks_goal_id_fkey FOREIGN KEY (goal_id) REFERENCES public.employee_goals(id) ON DELETE CASCADE;


--
-- Name: manager_evaluations manager_evaluations_cycle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manager_evaluations
    ADD CONSTRAINT manager_evaluations_cycle_id_fkey FOREIGN KEY (cycle_id) REFERENCES public.review_cycles(id) ON DELETE CASCADE;


--
-- Name: manager_evaluations manager_evaluations_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manager_evaluations
    ADD CONSTRAINT manager_evaluations_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: manager_evaluations manager_evaluations_goal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manager_evaluations
    ADD CONSTRAINT manager_evaluations_goal_id_fkey FOREIGN KEY (goal_id) REFERENCES public.employee_goals(id);


--
-- Name: manager_evaluations manager_evaluations_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manager_evaluations
    ADD CONSTRAINT manager_evaluations_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: manager_recommendations manager_recommendations_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manager_recommendations
    ADD CONSTRAINT manager_recommendations_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: manager_recommendations manager_recommendations_hr_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manager_recommendations
    ADD CONSTRAINT manager_recommendations_hr_id_fkey FOREIGN KEY (hr_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: manager_recommendations manager_recommendations_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manager_recommendations
    ADD CONSTRAINT manager_recommendations_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: manager_recommendations manager_recommendations_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manager_recommendations
    ADD CONSTRAINT manager_recommendations_period_id_fkey FOREIGN KEY (period_id) REFERENCES public.employee_review_periods(id);


--
-- Name: manager_reviews manager_reviews_cycle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manager_reviews
    ADD CONSTRAINT manager_reviews_cycle_id_fkey FOREIGN KEY (cycle_id) REFERENCES public.review_cycles(id);


--
-- Name: manager_reviews manager_reviews_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manager_reviews
    ADD CONSTRAINT manager_reviews_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.users(id);


--
-- Name: manager_reviews manager_reviews_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manager_reviews
    ADD CONSTRAINT manager_reviews_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.users(id);


--
-- Name: manager_reviews manager_reviews_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manager_reviews
    ADD CONSTRAINT manager_reviews_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.manager_review_questions(id);


--
-- Name: manager_reviews manager_reviews_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manager_reviews
    ADD CONSTRAINT manager_reviews_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id);


--
-- Name: notifications notifications_related_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_related_user_id_fkey FOREIGN KEY (related_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: peer_feedback_requests peer_feedback_requests_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.peer_feedback_requests
    ADD CONSTRAINT peer_feedback_requests_period_id_fkey FOREIGN KEY (period_id) REFERENCES public.employee_review_periods(id);


--
-- Name: peer_feedback_requests peer_feedback_requests_requester_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.peer_feedback_requests
    ADD CONSTRAINT peer_feedback_requests_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: peer_feedback_requests peer_feedback_requests_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.peer_feedback_requests
    ADD CONSTRAINT peer_feedback_requests_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: peer_feedbacks peer_feedbacks_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.peer_feedbacks
    ADD CONSTRAINT peer_feedbacks_period_id_fkey FOREIGN KEY (period_id) REFERENCES public.employee_review_periods(id);


--
-- Name: peer_feedbacks peer_feedbacks_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.peer_feedbacks
    ADD CONSTRAINT peer_feedbacks_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.peer_feedback_requests(id) ON DELETE CASCADE;


--
-- Name: peer_feedbacks peer_feedbacks_requester_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.peer_feedbacks
    ADD CONSTRAINT peer_feedbacks_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: peer_feedbacks peer_feedbacks_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.peer_feedbacks
    ADD CONSTRAINT peer_feedbacks_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: peer_reviews peer_reviews_cycle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.peer_reviews
    ADD CONSTRAINT peer_reviews_cycle_id_fkey FOREIGN KEY (cycle_id) REFERENCES public.review_cycles(id);


--
-- Name: peer_reviews peer_reviews_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.peer_reviews
    ADD CONSTRAINT peer_reviews_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.users(id);


--
-- Name: peer_reviews peer_reviews_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.peer_reviews
    ADD CONSTRAINT peer_reviews_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.peer_review_questions(id);


--
-- Name: peer_reviews peer_reviews_respondent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.peer_reviews
    ADD CONSTRAINT peer_reviews_respondent_id_fkey FOREIGN KEY (respondent_id) REFERENCES public.users(id);


--
-- Name: peer_reviews peer_reviews_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.peer_reviews
    ADD CONSTRAINT peer_reviews_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id);


--
-- Name: performance_review_status performance_review_status_hr_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.performance_review_status
    ADD CONSTRAINT performance_review_status_hr_approved_by_fkey FOREIGN KEY (hr_approved_by) REFERENCES public.users(id);


--
-- Name: performance_review_status performance_review_status_manager_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.performance_review_status
    ADD CONSTRAINT performance_review_status_manager_approved_by_fkey FOREIGN KEY (manager_approved_by) REFERENCES public.users(id);


--
-- Name: performance_review_status performance_review_status_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.performance_review_status
    ADD CONSTRAINT performance_review_status_period_id_fkey FOREIGN KEY (period_id) REFERENCES public.employee_review_periods(id) ON DELETE CASCADE;


--
-- Name: performance_review_status performance_review_status_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.performance_review_status
    ADD CONSTRAINT performance_review_status_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: potential_assessments potential_assessments_cycle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.potential_assessments
    ADD CONSTRAINT potential_assessments_cycle_id_fkey FOREIGN KEY (cycle_id) REFERENCES public.review_cycles(id);


--
-- Name: potential_assessments potential_assessments_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.potential_assessments
    ADD CONSTRAINT potential_assessments_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.users(id);


--
-- Name: potential_assessments potential_assessments_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.potential_assessments
    ADD CONSTRAINT potential_assessments_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.users(id);


--
-- Name: potential_detail_answers potential_detail_answers_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.potential_detail_answers
    ADD CONSTRAINT potential_detail_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.potential_detail_questions(id);


--
-- Name: selected_respondents selected_respondents_cycle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selected_respondents
    ADD CONSTRAINT selected_respondents_cycle_id_fkey FOREIGN KEY (cycle_id) REFERENCES public.review_cycles(id);


--
-- Name: selected_respondents selected_respondents_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selected_respondents
    ADD CONSTRAINT selected_respondents_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.users(id);


--
-- Name: selected_respondents selected_respondents_respondent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selected_respondents
    ADD CONSTRAINT selected_respondents_respondent_id_fkey FOREIGN KEY (respondent_id) REFERENCES public.users(id);


--
-- Name: selected_respondents selected_respondents_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selected_respondents
    ADD CONSTRAINT selected_respondents_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id);


--
-- Name: self_assessments self_assessments_cycle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.self_assessments
    ADD CONSTRAINT self_assessments_cycle_id_fkey FOREIGN KEY (cycle_id) REFERENCES public.review_cycles(id);


--
-- Name: self_assessments self_assessments_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.self_assessments
    ADD CONSTRAINT self_assessments_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id);


--
-- Name: self_assessments self_assessments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.self_assessments
    ADD CONSTRAINT self_assessments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: task_annotations task_annotations_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_annotations
    ADD CONSTRAINT task_annotations_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: task_leads task_leads_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_leads
    ADD CONSTRAINT task_leads_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: task_leads task_leads_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_leads
    ADD CONSTRAINT task_leads_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: task_participants task_participants_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_participants
    ADD CONSTRAINT task_participants_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: task_participants task_participants_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_participants
    ADD CONSTRAINT task_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_review_periods user_review_periods_cycle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_review_periods
    ADD CONSTRAINT user_review_periods_cycle_id_fkey FOREIGN KEY (cycle_id) REFERENCES public.review_cycles(id) ON DELETE CASCADE;


--
-- Name: user_review_periods user_review_periods_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_review_periods
    ADD CONSTRAINT user_review_periods_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users users_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

