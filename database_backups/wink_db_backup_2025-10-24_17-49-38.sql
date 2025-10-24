--
-- PostgreSQL database dump
--

-- Dumped from database version 14.1
-- Dumped by pg_dump version 17.4

-- Started on 2025-10-24 17:49:38

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
-- TOC entry 4 (class 2615 OID 2200)
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 226 (class 1259 OID 23626922)
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
    CONSTRAINT employee_goals_goal_number_check CHECK (((goal_number >= 1) AND (goal_number <= 5))),
    CONSTRAINT employee_goals_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'submitted'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])))
);


--
-- TOC entry 225 (class 1259 OID 23626921)
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
-- TOC entry 3841 (class 0 OID 0)
-- Dependencies: 225
-- Name: employee_goals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.employee_goals_id_seq OWNED BY public.employee_goals.id;


--
-- TOC entry 258 (class 1259 OID 23627295)
-- Name: employee_recommendations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_recommendations (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    cycle_id integer NOT NULL,
    recommendation_text text NOT NULL,
    source character varying(50),
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 257 (class 1259 OID 23627294)
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
-- TOC entry 3842 (class 0 OID 0)
-- Dependencies: 257
-- Name: employee_recommendations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.employee_recommendations_id_seq OWNED BY public.employee_recommendations.id;


--
-- TOC entry 222 (class 1259 OID 23626860)
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
-- TOC entry 221 (class 1259 OID 23626859)
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
-- TOC entry 3843 (class 0 OID 0)
-- Dependencies: 221
-- Name: employee_tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.employee_tasks_id_seq OWNED BY public.employee_tasks.id;


--
-- TOC entry 254 (class 1259 OID 23627253)
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
-- TOC entry 253 (class 1259 OID 23627252)
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
-- TOC entry 3844 (class 0 OID 0)
-- Dependencies: 253
-- Name: final_reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.final_reviews_id_seq OWNED BY public.final_reviews.id;


--
-- TOC entry 232 (class 1259 OID 23626986)
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
-- TOC entry 231 (class 1259 OID 23626985)
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
-- TOC entry 3845 (class 0 OID 0)
-- Dependencies: 231
-- Name: form_sections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.form_sections_id_seq OWNED BY public.form_sections.id;


--
-- TOC entry 234 (class 1259 OID 23627004)
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
-- TOC entry 233 (class 1259 OID 23627003)
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
-- TOC entry 3846 (class 0 OID 0)
-- Dependencies: 233
-- Name: form_static_blocks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.form_static_blocks_id_seq OWNED BY public.form_static_blocks.id;


--
-- TOC entry 230 (class 1259 OID 23626969)
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
-- TOC entry 229 (class 1259 OID 23626968)
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
-- TOC entry 3847 (class 0 OID 0)
-- Dependencies: 229
-- Name: form_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.form_templates_id_seq OWNED BY public.form_templates.id;


--
-- TOC entry 228 (class 1259 OID 23626950)
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
-- TOC entry 227 (class 1259 OID 23626949)
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
-- TOC entry 3848 (class 0 OID 0)
-- Dependencies: 227
-- Name: goal_tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.goal_tasks_id_seq OWNED BY public.goal_tasks.id;


--
-- TOC entry 264 (class 1259 OID 23627425)
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
-- TOC entry 263 (class 1259 OID 23627424)
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
-- TOC entry 3849 (class 0 OID 0)
-- Dependencies: 263
-- Name: manager_evaluations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.manager_evaluations_id_seq OWNED BY public.manager_evaluations.id;


--
-- TOC entry 244 (class 1259 OID 23627123)
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
-- TOC entry 243 (class 1259 OID 23627122)
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
-- TOC entry 3850 (class 0 OID 0)
-- Dependencies: 243
-- Name: manager_review_questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.manager_review_questions_id_seq OWNED BY public.manager_review_questions.id;


--
-- TOC entry 246 (class 1259 OID 23627136)
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
-- TOC entry 245 (class 1259 OID 23627135)
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
-- TOC entry 3851 (class 0 OID 0)
-- Dependencies: 245
-- Name: manager_reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.manager_reviews_id_seq OWNED BY public.manager_reviews.id;


--
-- TOC entry 268 (class 1259 OID 23627506)
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
-- TOC entry 267 (class 1259 OID 23627505)
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
-- TOC entry 3852 (class 0 OID 0)
-- Dependencies: 267
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- TOC entry 260 (class 1259 OID 23627322)
-- Name: peer_feedback_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.peer_feedback_requests (
    id integer NOT NULL,
    requester_id integer,
    reviewer_id integer,
    cycle_id integer,
    status character varying(20) DEFAULT 'pending'::character varying,
    message text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    completed_at timestamp without time zone
);


--
-- TOC entry 259 (class 1259 OID 23627321)
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
-- TOC entry 3853 (class 0 OID 0)
-- Dependencies: 259
-- Name: peer_feedback_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.peer_feedback_requests_id_seq OWNED BY public.peer_feedback_requests.id;


--
-- TOC entry 262 (class 1259 OID 23627350)
-- Name: peer_feedbacks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.peer_feedbacks (
    id integer NOT NULL,
    request_id integer,
    requester_id integer,
    reviewer_id integer,
    cycle_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    result_achievement_rating integer,
    personal_qualities_comment text,
    interaction_quality_rating integer,
    improvement_suggestions text,
    CONSTRAINT peer_feedbacks_interaction_quality_rating_check CHECK (((interaction_quality_rating >= 0) AND (interaction_quality_rating <= 10))),
    CONSTRAINT peer_feedbacks_result_achievement_rating_check CHECK (((result_achievement_rating >= 0) AND (result_achievement_rating <= 10)))
);


--
-- TOC entry 261 (class 1259 OID 23627349)
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
-- TOC entry 3854 (class 0 OID 0)
-- Dependencies: 261
-- Name: peer_feedbacks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.peer_feedbacks_id_seq OWNED BY public.peer_feedbacks.id;


--
-- TOC entry 240 (class 1259 OID 23627071)
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
-- TOC entry 239 (class 1259 OID 23627070)
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
-- TOC entry 3855 (class 0 OID 0)
-- Dependencies: 239
-- Name: peer_review_questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.peer_review_questions_id_seq OWNED BY public.peer_review_questions.id;


--
-- TOC entry 242 (class 1259 OID 23627084)
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
-- TOC entry 241 (class 1259 OID 23627083)
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
-- TOC entry 3856 (class 0 OID 0)
-- Dependencies: 241
-- Name: peer_reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.peer_reviews_id_seq OWNED BY public.peer_reviews.id;


--
-- TOC entry 248 (class 1259 OID 23627175)
-- Name: potential_assessments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.potential_assessments (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    manager_id integer NOT NULL,
    cycle_id integer NOT NULL,
    professional_qualities text[],
    takes_responsibility boolean DEFAULT false,
    transparent_communication boolean DEFAULT false,
    shares_information boolean DEFAULT false,
    organizes_work boolean DEFAULT false,
    growth_mindset_score integer,
    readiness_timeframe character varying(20),
    is_successor boolean DEFAULT false,
    handles_communication_barriers boolean DEFAULT false,
    reflects_on_results boolean DEFAULT false,
    desires_role character varying(100),
    role_interest_level integer,
    risk_assessment integer,
    performance_score integer,
    potential_score integer,
    box_position character varying(50),
    comments text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    ole_priority_1 text,
    ole_priority_2 text,
    CONSTRAINT potential_assessments_box_position_check CHECK (((box_position)::text = ANY (ARRAY[('low_potential_low_performance'::character varying)::text, ('low_potential_medium_performance'::character varying)::text, ('low_potential_high_performance'::character varying)::text, ('medium_potential_low_performance'::character varying)::text, ('medium_potential_medium_performance'::character varying)::text, ('medium_potential_high_performance'::character varying)::text, ('high_potential_low_performance'::character varying)::text, ('high_potential_medium_performance'::character varying)::text, ('high_potential_high_performance'::character varying)::text]))),
    CONSTRAINT potential_assessments_growth_mindset_score_check CHECK (((growth_mindset_score >= 0) AND (growth_mindset_score <= 10))),
    CONSTRAINT potential_assessments_readiness_timeframe_check CHECK (((readiness_timeframe)::text = ANY ((ARRAY['1-2_years'::character varying, '3_years'::character varying, '3+_years'::character varying, 'not_ready'::character varying])::text[]))),
    CONSTRAINT potential_assessments_risk_assessment_check CHECK (((risk_assessment >= 0) AND (risk_assessment <= 10))),
    CONSTRAINT potential_assessments_role_interest_level_check CHECK (((role_interest_level >= 0) AND (role_interest_level <= 10)))
);


--
-- TOC entry 247 (class 1259 OID 23627174)
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
-- TOC entry 3857 (class 0 OID 0)
-- Dependencies: 247
-- Name: potential_assessments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.potential_assessments_id_seq OWNED BY public.potential_assessments.id;


--
-- TOC entry 252 (class 1259 OID 23627230)
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
-- TOC entry 251 (class 1259 OID 23627229)
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
-- TOC entry 3858 (class 0 OID 0)
-- Dependencies: 251
-- Name: potential_detail_answers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.potential_detail_answers_id_seq OWNED BY public.potential_detail_answers.id;


--
-- TOC entry 250 (class 1259 OID 23627217)
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
-- TOC entry 249 (class 1259 OID 23627216)
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
-- TOC entry 3859 (class 0 OID 0)
-- Dependencies: 249
-- Name: potential_detail_questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.potential_detail_questions_id_seq OWNED BY public.potential_detail_questions.id;


--
-- TOC entry 256 (class 1259 OID 23627283)
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
-- TOC entry 255 (class 1259 OID 23627282)
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
-- TOC entry 3860 (class 0 OID 0)
-- Dependencies: 255
-- Name: recommendation_triggers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.recommendation_triggers_id_seq OWNED BY public.recommendation_triggers.id;


--
-- TOC entry 212 (class 1259 OID 23626776)
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
-- TOC entry 211 (class 1259 OID 23626775)
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
-- TOC entry 3861 (class 0 OID 0)
-- Dependencies: 211
-- Name: review_cycles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.review_cycles_id_seq OWNED BY public.review_cycles.id;


--
-- TOC entry 224 (class 1259 OID 23626888)
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
-- TOC entry 223 (class 1259 OID 23626887)
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
-- TOC entry 3862 (class 0 OID 0)
-- Dependencies: 223
-- Name: selected_respondents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.selected_respondents_id_seq OWNED BY public.selected_respondents.id;


--
-- TOC entry 236 (class 1259 OID 23627025)
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
-- TOC entry 235 (class 1259 OID 23627024)
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
-- TOC entry 3863 (class 0 OID 0)
-- Dependencies: 235
-- Name: self_assessment_questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.self_assessment_questions_id_seq OWNED BY public.self_assessment_questions.id;


--
-- TOC entry 238 (class 1259 OID 23627038)
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
-- TOC entry 237 (class 1259 OID 23627037)
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
-- TOC entry 3864 (class 0 OID 0)
-- Dependencies: 237
-- Name: self_assessments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.self_assessments_id_seq OWNED BY public.self_assessments.id;


--
-- TOC entry 220 (class 1259 OID 23626844)
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
-- TOC entry 219 (class 1259 OID 23626843)
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
-- TOC entry 3865 (class 0 OID 0)
-- Dependencies: 219
-- Name: task_annotations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.task_annotations_id_seq OWNED BY public.task_annotations.id;


--
-- TOC entry 216 (class 1259 OID 23626801)
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
-- TOC entry 215 (class 1259 OID 23626800)
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
-- TOC entry 3866 (class 0 OID 0)
-- Dependencies: 215
-- Name: task_leads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.task_leads_id_seq OWNED BY public.task_leads.id;


--
-- TOC entry 218 (class 1259 OID 23626823)
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
-- TOC entry 217 (class 1259 OID 23626822)
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
-- TOC entry 3867 (class 0 OID 0)
-- Dependencies: 217
-- Name: task_participants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.task_participants_id_seq OWNED BY public.task_participants.id;


--
-- TOC entry 214 (class 1259 OID 23626786)
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
-- TOC entry 213 (class 1259 OID 23626785)
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
-- TOC entry 3868 (class 0 OID 0)
-- Dependencies: 213
-- Name: tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tasks_id_seq OWNED BY public.tasks.id;


--
-- TOC entry 266 (class 1259 OID 23627477)
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
-- TOC entry 265 (class 1259 OID 23627476)
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
-- TOC entry 3869 (class 0 OID 0)
-- Dependencies: 265
-- Name: user_review_periods_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_review_periods_id_seq OWNED BY public.user_review_periods.id;


--
-- TOC entry 210 (class 1259 OID 23626753)
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
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['employee'::character varying, 'manager'::character varying, 'hr'::character varying, 'admin'::character varying])::text[])))
);


--
-- TOC entry 209 (class 1259 OID 23626752)
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
-- TOC entry 3870 (class 0 OID 0)
-- Dependencies: 209
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 3333 (class 2604 OID 23626925)
-- Name: employee_goals id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_goals ALTER COLUMN id SET DEFAULT nextval('public.employee_goals_id_seq'::regclass);


--
-- TOC entry 3392 (class 2604 OID 23627298)
-- Name: employee_recommendations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_recommendations ALTER COLUMN id SET DEFAULT nextval('public.employee_recommendations_id_seq'::regclass);


--
-- TOC entry 3328 (class 2604 OID 23626863)
-- Name: employee_tasks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_tasks ALTER COLUMN id SET DEFAULT nextval('public.employee_tasks_id_seq'::regclass);


--
-- TOC entry 3384 (class 2604 OID 23627256)
-- Name: final_reviews id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.final_reviews ALTER COLUMN id SET DEFAULT nextval('public.final_reviews_id_seq'::regclass);


--
-- TOC entry 3344 (class 2604 OID 23626989)
-- Name: form_sections id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_sections ALTER COLUMN id SET DEFAULT nextval('public.form_sections_id_seq'::regclass);


--
-- TOC entry 3348 (class 2604 OID 23627007)
-- Name: form_static_blocks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_static_blocks ALTER COLUMN id SET DEFAULT nextval('public.form_static_blocks_id_seq'::regclass);


--
-- TOC entry 3339 (class 2604 OID 23626972)
-- Name: form_templates id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_templates ALTER COLUMN id SET DEFAULT nextval('public.form_templates_id_seq'::regclass);


--
-- TOC entry 3337 (class 2604 OID 23626953)
-- Name: goal_tasks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goal_tasks ALTER COLUMN id SET DEFAULT nextval('public.goal_tasks_id_seq'::regclass);


--
-- TOC entry 3400 (class 2604 OID 23627428)
-- Name: manager_evaluations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manager_evaluations ALTER COLUMN id SET DEFAULT nextval('public.manager_evaluations_id_seq'::regclass);


--
-- TOC entry 3362 (class 2604 OID 23627126)
-- Name: manager_review_questions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manager_review_questions ALTER COLUMN id SET DEFAULT nextval('public.manager_review_questions_id_seq'::regclass);


--
-- TOC entry 3366 (class 2604 OID 23627139)
-- Name: manager_reviews id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manager_reviews ALTER COLUMN id SET DEFAULT nextval('public.manager_reviews_id_seq'::regclass);


--
-- TOC entry 3409 (class 2604 OID 23627509)
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- TOC entry 3394 (class 2604 OID 23627325)
-- Name: peer_feedback_requests id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.peer_feedback_requests ALTER COLUMN id SET DEFAULT nextval('public.peer_feedback_requests_id_seq'::regclass);


--
-- TOC entry 3397 (class 2604 OID 23627353)
-- Name: peer_feedbacks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.peer_feedbacks ALTER COLUMN id SET DEFAULT nextval('public.peer_feedbacks_id_seq'::regclass);


--
-- TOC entry 3356 (class 2604 OID 23627074)
-- Name: peer_review_questions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.peer_review_questions ALTER COLUMN id SET DEFAULT nextval('public.peer_review_questions_id_seq'::regclass);


--
-- TOC entry 3360 (class 2604 OID 23627087)
-- Name: peer_reviews id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.peer_reviews ALTER COLUMN id SET DEFAULT nextval('public.peer_reviews_id_seq'::regclass);


--
-- TOC entry 3368 (class 2604 OID 23627178)
-- Name: potential_assessments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.potential_assessments ALTER COLUMN id SET DEFAULT nextval('public.potential_assessments_id_seq'::regclass);


--
-- TOC entry 3382 (class 2604 OID 23627233)
-- Name: potential_detail_answers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.potential_detail_answers ALTER COLUMN id SET DEFAULT nextval('public.potential_detail_answers_id_seq'::regclass);


--
-- TOC entry 3378 (class 2604 OID 23627220)
-- Name: potential_detail_questions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.potential_detail_questions ALTER COLUMN id SET DEFAULT nextval('public.potential_detail_questions_id_seq'::regclass);


--
-- TOC entry 3389 (class 2604 OID 23627286)
-- Name: recommendation_triggers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recommendation_triggers ALTER COLUMN id SET DEFAULT nextval('public.recommendation_triggers_id_seq'::regclass);


--
-- TOC entry 3313 (class 2604 OID 23626779)
-- Name: review_cycles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_cycles ALTER COLUMN id SET DEFAULT nextval('public.review_cycles_id_seq'::regclass);


--
-- TOC entry 3330 (class 2604 OID 23626891)
-- Name: selected_respondents id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selected_respondents ALTER COLUMN id SET DEFAULT nextval('public.selected_respondents_id_seq'::regclass);


--
-- TOC entry 3350 (class 2604 OID 23627028)
-- Name: self_assessment_questions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.self_assessment_questions ALTER COLUMN id SET DEFAULT nextval('public.self_assessment_questions_id_seq'::regclass);


--
-- TOC entry 3354 (class 2604 OID 23627041)
-- Name: self_assessments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.self_assessments ALTER COLUMN id SET DEFAULT nextval('public.self_assessments_id_seq'::regclass);


--
-- TOC entry 3325 (class 2604 OID 23626847)
-- Name: task_annotations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_annotations ALTER COLUMN id SET DEFAULT nextval('public.task_annotations_id_seq'::regclass);


--
-- TOC entry 3320 (class 2604 OID 23626804)
-- Name: task_leads id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_leads ALTER COLUMN id SET DEFAULT nextval('public.task_leads_id_seq'::regclass);


--
-- TOC entry 3322 (class 2604 OID 23626826)
-- Name: task_participants id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_participants ALTER COLUMN id SET DEFAULT nextval('public.task_participants_id_seq'::regclass);


--
-- TOC entry 3316 (class 2604 OID 23626789)
-- Name: tasks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks ALTER COLUMN id SET DEFAULT nextval('public.tasks_id_seq'::regclass);


--
-- TOC entry 3403 (class 2604 OID 23627480)
-- Name: user_review_periods id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_review_periods ALTER COLUMN id SET DEFAULT nextval('public.user_review_periods_id_seq'::regclass);


--
-- TOC entry 3309 (class 2604 OID 23626756)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 3793 (class 0 OID 23626922)
-- Dependencies: 226
-- Data for Name: employee_goals; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.employee_goals (id, user_id, cycle_id, goal_number, title, description, expected_deadline, expected_results, key_tasks, status, created_at, updated_at, rejection_comment) FROM stdin;
1	9	2	1	Внедрить микросервисную архитектуру	Разделить монолит на 5 независимых сервисов	\N	\N	\N	submitted	2025-10-24 09:29:58.136102	2025-10-24 09:29:58.136102	\N
3	11	2	1	Изучить React и TypeScript	Освоить современный стек фронтенда	\N	\N	\N	approved	2025-10-24 09:29:58.141177	2025-10-24 09:44:07.3203	\N
2	10	2	1	Повысить покрытие тестами до 80%	Написать unit и integration тесты для критичных модулей	\N	\N	\N	approved	2025-10-24 09:29:58.139194	2025-10-24 10:06:22.32098	\N
4	11	2	2	Примпер	ваамва	2025-12-09	впа	ыыуау	rejected	2025-10-24 09:43:36.248152	2025-10-24 16:07:56.592603	апафыалвы
\.


--
-- TOC entry 3825 (class 0 OID 23627295)
-- Dependencies: 258
-- Data for Name: employee_recommendations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.employee_recommendations (id, employee_id, cycle_id, recommendation_text, source, created_by, created_at) FROM stdin;
\.


--
-- TOC entry 3789 (class 0 OID 23626860)
-- Dependencies: 222
-- Data for Name: employee_tasks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.employee_tasks (id, user_id, task_id, cycle_id, task_order, created_at) FROM stdin;
\.


--
-- TOC entry 3821 (class 0 OID 23627253)
-- Dependencies: 254
-- Data for Name: final_reviews; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.final_reviews (id, employee_id, cycle_id, self_assessment_total, peer_review_total, manager_review_total, potential_total, total_score, rating, rating_category, salary_increase_recommended, salary_increase_percent, status, final_feedback, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3799 (class 0 OID 23626986)
-- Dependencies: 232
-- Data for Name: form_sections; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.form_sections (id, template_id, title, description, display_order, section_type, is_collapsible, created_at) FROM stdin;
\.


--
-- TOC entry 3801 (class 0 OID 23627004)
-- Dependencies: 234
-- Data for Name: form_static_blocks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.form_static_blocks (id, template_id, section_id, block_type, content, display_order, created_at) FROM stdin;
\.


--
-- TOC entry 3797 (class 0 OID 23626969)
-- Dependencies: 230
-- Data for Name: form_templates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.form_templates (id, code, title, audience, purpose, applies_per, is_active, display_order, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3795 (class 0 OID 23626950)
-- Dependencies: 228
-- Data for Name: goal_tasks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.goal_tasks (id, goal_id, task_number, task_description, created_at) FROM stdin;
\.


--
-- TOC entry 3831 (class 0 OID 23627425)
-- Dependencies: 264
-- Data for Name: manager_evaluations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.manager_evaluations (id, employee_id, manager_id, cycle_id, professional_qualities_score, personal_qualities_score, communication_with_colleagues, employee_development_willingness, considers_as_successor, development_readiness, turnover_risk_score, priorities_from_opz, performance_total, potential_total, created_at, updated_at, result_achievement_rating, personal_qualities_comment, personal_contribution_comment, interaction_quality_rating, improvement_suggestions, overall_rating, feedback_summary, goal_id) FROM stdin;
14	1	3	2	3	4	\N	\N	\N	\N	\N	\N	4	7	2025-10-24 13:26:55.095026	2025-10-24 13:26:55.095026	\N	\N	\N	\N	\N	\N	\N	\N
15	2	3	2	4	3	\N	\N	\N	\N	\N	\N	6	7	2025-10-24 13:26:55.105963	2025-10-24 13:26:55.105963	\N	\N	\N	\N	\N	\N	\N	\N
16	7	3	2	3	4	\N	\N	\N	\N	\N	\N	6	7	2025-10-24 13:26:55.116922	2025-10-24 13:26:55.116922	\N	\N	\N	\N	\N	\N	\N	\N
20	10	7	2	5	4	t	t	t	1-2_years	1	\N	9	9	2025-10-24 17:07:57.064101	2025-10-24 17:07:57.064101	10	\N	\N	10	\N	10	Отличный сотрудник с высоким потенциалом роста	\N
21	9	7	2	5	4	t	t	f	3_years	2	\N	8	6	2025-10-24 17:07:57.079044	2025-10-24 17:07:57.079044	8	\N	\N	7	\N	8	Стабильные высокие результаты	\N
22	11	7	2	4	4	t	f	f	3_years	2	\N	7	6	2025-10-24 17:07:57.083051	2025-10-24 17:07:57.083051	7	\N	\N	7	\N	7	Надежный специалист	\N
23	12	7	2	3	3	f	t	f	3+_years	3	\N	5	5	2025-10-24 17:07:57.08633	2025-10-24 17:07:57.08633	5	\N	\N	5	\N	5	Средние результаты, есть потенциал	\N
24	13	7	2	2	2	f	f	f	not_ready	5	\N	3	2	2025-10-24 17:07:57.09077	2025-10-24 17:07:57.09077	3	\N	\N	3	\N	3	Требует значительного развития	\N
\.


--
-- TOC entry 3811 (class 0 OID 23627123)
-- Dependencies: 244
-- Data for Name: manager_review_questions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.manager_review_questions (id, question_text, question_type, max_score, weight, is_active, display_order, created_at) FROM stdin;
2	Качество выполнения работы	scale_0_10	10	1.00	t	1	2025-10-24 15:03:39.483914
3	Соблюдение сроков	scale_0_10	10	1.00	t	2	2025-10-24 15:03:39.48846
4	Инициативность	scale_0_10	10	1.00	t	3	2025-10-24 15:03:39.49013
5	Коммуникабельность	scale_0_10	10	1.00	t	4	2025-10-24 15:03:39.491724
6	Способность работать в команде	scale_0_10	10	1.00	t	5	2025-10-24 15:03:39.493142
\.


--
-- TOC entry 3813 (class 0 OID 23627136)
-- Dependencies: 246
-- Data for Name: manager_reviews; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.manager_reviews (id, employee_id, manager_id, task_id, cycle_id, question_id, answer_text, answer_score, feedback_summary, created_at) FROM stdin;
1	1	2	3	2	2	Ответ на вопрос 2	7	Оценка руководителя для Иван Иванов	2025-10-24 15:04:02.212028
2	1	2	3	2	3	Ответ на вопрос 3	6	Оценка руководителя для Иван Иванов	2025-10-24 15:04:02.218611
3	1	2	3	2	4	Ответ на вопрос 4	9	Оценка руководителя для Иван Иванов	2025-10-24 15:04:02.220507
4	1	2	3	2	5	Ответ на вопрос 5	7	Оценка руководителя для Иван Иванов	2025-10-24 15:04:02.22194
5	1	2	3	2	6	Ответ на вопрос 6	6	Оценка руководителя для Иван Иванов	2025-10-24 15:04:02.223338
6	9	2	3	2	2	Ответ на вопрос 2	6	Оценка руководителя для Иван Иванов	2025-10-24 15:04:02.286623
7	9	2	3	2	3	Ответ на вопрос 3	6	Оценка руководителя для Иван Иванов	2025-10-24 15:04:02.287943
8	9	2	3	2	4	Ответ на вопрос 4	6	Оценка руководителя для Иван Иванов	2025-10-24 15:04:02.289179
9	9	2	3	2	5	Ответ на вопрос 5	7	Оценка руководителя для Иван Иванов	2025-10-24 15:04:02.290249
10	9	2	3	2	6	Ответ на вопрос 6	9	Оценка руководителя для Иван Иванов	2025-10-24 15:04:02.291155
11	10	2	1	2	2	Ответ на вопрос 2	9	Оценка руководителя для Анна Сидорова	2025-10-24 15:04:02.30661
12	10	2	1	2	3	Ответ на вопрос 3	7	Оценка руководителя для Анна Сидорова	2025-10-24 15:04:02.307924
13	10	2	1	2	4	Ответ на вопрос 4	7	Оценка руководителя для Анна Сидорова	2025-10-24 15:04:02.309497
14	10	2	1	2	5	Ответ на вопрос 5	7	Оценка руководителя для Анна Сидорова	2025-10-24 15:04:02.311264
15	10	2	1	2	6	Ответ на вопрос 6	6	Оценка руководителя для Анна Сидорова	2025-10-24 15:04:02.31245
16	11	2	1	2	2	Ответ на вопрос 2	8	Оценка руководителя для Петр Петров	2025-10-24 15:04:02.328015
17	11	2	1	2	3	Ответ на вопрос 3	6	Оценка руководителя для Петр Петров	2025-10-24 15:04:02.329469
18	11	2	1	2	4	Ответ на вопрос 4	9	Оценка руководителя для Петр Петров	2025-10-24 15:04:02.330843
19	11	2	1	2	5	Ответ на вопрос 5	7	Оценка руководителя для Петр Петров	2025-10-24 15:04:02.332054
20	11	2	1	2	6	Ответ на вопрос 6	9	Оценка руководителя для Петр Петров	2025-10-24 15:04:02.333222
21	12	2	2	2	2	Ответ на вопрос 2	7	Оценка руководителя для Ольга Васильева	2025-10-24 15:04:02.351543
22	12	2	2	2	3	Ответ на вопрос 3	7	Оценка руководителя для Ольга Васильева	2025-10-24 15:04:02.3529
23	12	2	2	2	4	Ответ на вопрос 4	7	Оценка руководителя для Ольга Васильева	2025-10-24 15:04:02.354553
24	12	2	2	2	5	Ответ на вопрос 5	8	Оценка руководителя для Ольга Васильева	2025-10-24 15:04:02.356811
25	12	2	2	2	6	Ответ на вопрос 6	8	Оценка руководителя для Ольга Васильева	2025-10-24 15:04:02.358296
26	13	2	2	2	2	Ответ на вопрос 2	7	Оценка руководителя для Дмитрий Смирнов	2025-10-24 15:04:02.381817
27	13	2	2	2	3	Ответ на вопрос 3	6	Оценка руководителя для Дмитрий Смирнов	2025-10-24 15:04:02.383313
28	13	2	2	2	4	Ответ на вопрос 4	6	Оценка руководителя для Дмитрий Смирнов	2025-10-24 15:04:02.3851
29	13	2	2	2	5	Ответ на вопрос 5	8	Оценка руководителя для Дмитрий Смирнов	2025-10-24 15:04:02.387062
30	13	2	2	2	6	Ответ на вопрос 6	6	Оценка руководителя для Дмитрий Смирнов	2025-10-24 15:04:02.38852
\.


--
-- TOC entry 3835 (class 0 OID 23627506)
-- Dependencies: 268
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, user_id, type, title, message, related_user_id, related_id, is_read, read_at, created_at) FROM stdin;
\.


--
-- TOC entry 3827 (class 0 OID 23627322)
-- Dependencies: 260
-- Data for Name: peer_feedback_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.peer_feedback_requests (id, requester_id, reviewer_id, cycle_id, status, message, created_at, completed_at) FROM stdin;
1	11	9	2	completed	цаываывпыв	2025-10-24 09:45:54.380588	2025-10-24 09:46:22.250603
2	7	11	2	completed	\N	2025-10-24 12:00:09.240923	2025-10-24 16:08:18.521598
3	13	1	1	pending	Мы работали вместе на проекте оцени пожалуйста!	2025-10-24 17:21:59.949558	\N
\.


--
-- TOC entry 3829 (class 0 OID 23627350)
-- Dependencies: 262
-- Data for Name: peer_feedbacks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.peer_feedbacks (id, request_id, requester_id, reviewer_id, cycle_id, created_at, updated_at, result_achievement_rating, personal_qualities_comment, interaction_quality_rating, improvement_suggestions) FROM stdin;
1	1	11	9	2	2025-10-24 09:46:22.24674	2025-10-24 09:46:22.24674	10	ыфаыпаы	10	фафы
2	2	7	11	2	2025-10-24 16:08:18.502232	2025-10-24 16:08:18.502232	10	123	10	123
\.


--
-- TOC entry 3807 (class 0 OID 23627071)
-- Dependencies: 240
-- Data for Name: peer_review_questions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.peer_review_questions (id, question_text, question_type, max_score, weight, is_active, display_order, created_at) FROM stdin;
1	Эффективность совместной работы	scale_0_10	10	1.00	t	1	2025-10-24 15:03:39.498234
2	Готовность помогать коллегам	scale_0_10	10	1.00	t	2	2025-10-24 15:03:39.500192
3	Профессионализм	scale_0_10	10	1.00	t	3	2025-10-24 15:03:39.502142
4	Ответственность	scale_0_10	10	1.00	t	4	2025-10-24 15:03:39.504041
5	Конструктивность в общении	scale_0_10	10	1.00	t	5	2025-10-24 15:03:39.505534
\.


--
-- TOC entry 3809 (class 0 OID 23627084)
-- Dependencies: 242
-- Data for Name: peer_reviews; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.peer_reviews (id, employee_id, respondent_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) FROM stdin;
2	1	2	3	2	1	Оценка коллеги по вопросу 1	4	2025-10-24 15:04:02.231205
3	1	2	3	2	2	Оценка коллеги по вопросу 2	3	2025-10-24 15:04:02.233674
4	1	2	3	2	3	Оценка коллеги по вопросу 3	4	2025-10-24 15:04:02.235037
5	1	2	3	2	4	Оценка коллеги по вопросу 4	5	2025-10-24 15:04:02.236558
6	1	2	3	2	5	Оценка коллеги по вопросу 5	4	2025-10-24 15:04:02.237627
7	2	8	1	2	1	Оценка коллеги по вопросу 1	4	2025-10-24 15:04:02.250014
8	2	8	1	2	2	Оценка коллеги по вопросу 2	4	2025-10-24 15:04:02.25156
9	2	8	1	2	3	Оценка коллеги по вопросу 3	5	2025-10-24 15:04:02.252846
10	2	8	1	2	4	Оценка коллеги по вопросу 4	3	2025-10-24 15:04:02.253822
11	2	8	1	2	5	Оценка коллеги по вопросу 5	4	2025-10-24 15:04:02.254529
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
27	10	1	2	2	1	Оценка коллеги по вопросу 1	5	2025-10-24 15:04:02.316193
28	10	1	2	2	2	Оценка коллеги по вопросу 2	5	2025-10-24 15:04:02.317405
29	10	1	2	2	3	Оценка коллеги по вопросу 3	4	2025-10-24 15:04:02.318229
30	10	1	2	2	4	Оценка коллеги по вопросу 4	3	2025-10-24 15:04:02.3192
31	10	1	2	2	5	Оценка коллеги по вопросу 5	3	2025-10-24 15:04:02.320202
32	11	7	1	2	1	Оценка коллеги по вопросу 1	4	2025-10-24 15:04:02.337641
33	11	7	1	2	2	Оценка коллеги по вопросу 2	5	2025-10-24 15:04:02.339383
34	11	7	1	2	3	Оценка коллеги по вопросу 3	4	2025-10-24 15:04:02.340893
35	11	7	1	2	4	Оценка коллеги по вопросу 4	3	2025-10-24 15:04:02.34244
36	11	7	1	2	5	Оценка коллеги по вопросу 5	3	2025-10-24 15:04:02.343455
37	12	2	3	2	1	Оценка коллеги по вопросу 1	5	2025-10-24 15:04:02.364942
38	12	2	3	2	2	Оценка коллеги по вопросу 2	5	2025-10-24 15:04:02.366302
39	12	2	3	2	3	Оценка коллеги по вопросу 3	5	2025-10-24 15:04:02.367669
40	12	2	3	2	4	Оценка коллеги по вопросу 4	4	2025-10-24 15:04:02.369147
41	12	2	3	2	5	Оценка коллеги по вопросу 5	3	2025-10-24 15:04:02.371137
42	13	10	3	2	1	Оценка коллеги по вопросу 1	5	2025-10-24 15:04:02.394089
43	13	10	3	2	2	Оценка коллеги по вопросу 2	5	2025-10-24 15:04:02.395773
44	13	10	3	2	3	Оценка коллеги по вопросу 3	5	2025-10-24 15:04:02.397255
45	13	10	3	2	4	Оценка коллеги по вопросу 4	3	2025-10-24 15:04:02.398783
46	13	10	3	2	5	Оценка коллеги по вопросу 5	5	2025-10-24 15:04:02.400627
\.


--
-- TOC entry 3815 (class 0 OID 23627175)
-- Dependencies: 248
-- Data for Name: potential_assessments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.potential_assessments (id, employee_id, manager_id, cycle_id, professional_qualities, takes_responsibility, transparent_communication, shares_information, organizes_work, growth_mindset_score, readiness_timeframe, is_successor, handles_communication_barriers, reflects_on_results, desires_role, role_interest_level, risk_assessment, performance_score, potential_score, box_position, comments, created_at, updated_at, ole_priority_1, ole_priority_2) FROM stdin;
26	10	7	2	{Ответственность,"Ориентация на результат","Стремление к развитию"}	t	t	t	t	10	1-2_years	t	t	t	Team Lead	10	\N	\N	\N	\N	Отличные результаты, высокий потенциал для роста до руководящей позиции	2025-10-24 17:08:07.632912	2025-10-24 17:08:07.632912	\N	\N
27	9	7	2	{Ответственность,"Ориентация на результат"}	t	t	f	t	7	3_years	f	t	t	Senior Developer	7	\N	\N	\N	\N	Стабильно высокие результаты, хороший специалист	2025-10-24 17:08:07.643982	2025-10-24 17:08:07.643982	\N	\N
28	11	7	2	{Ответственность,Надежность}	t	t	t	t	6	3_years	f	t	f	Senior Specialist	6	\N	\N	\N	\N	Надежный сотрудник с отличными результатами	2025-10-24 17:08:07.646798	2025-10-24 17:08:07.646798	\N	\N
29	12	7	2	{Ответственность}	t	f	f	f	5	3+_years	f	f	t	Specialist	4	\N	\N	\N	\N	Стабильные результаты, есть потенциал для развития	2025-10-24 17:08:07.649486	2025-10-24 17:08:07.649486	\N	\N
30	13	7	2	{"Базовые навыки"}	f	f	f	f	3	not_ready	f	f	f	Junior	3	\N	\N	\N	\N	Требует дополнительного развития навыков	2025-10-24 17:08:07.652998	2025-10-24 17:08:07.652998	\N	\N
\.


--
-- TOC entry 3819 (class 0 OID 23627230)
-- Dependencies: 252
-- Data for Name: potential_detail_answers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.potential_detail_answers (id, assessment_id, question_id, answer_boolean, answer_integer, answer_text, created_at) FROM stdin;
\.


--
-- TOC entry 3817 (class 0 OID 23627217)
-- Dependencies: 250
-- Data for Name: potential_detail_questions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.potential_detail_questions (id, question_number, question_text, answer_type, weight, is_active, display_order, created_at) FROM stdin;
\.


--
-- TOC entry 3823 (class 0 OID 23627283)
-- Dependencies: 256
-- Data for Name: recommendation_triggers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.recommendation_triggers (id, trigger_word, recommendation_text, category, is_active, created_at) FROM stdin;
\.


--
-- TOC entry 3779 (class 0 OID 23626776)
-- Dependencies: 212
-- Data for Name: review_cycles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.review_cycles (id, name, start_date, end_date, status, created_at) FROM stdin;
1	Первое полугодие 2025	2025-01-01	2025-06-30	active	2025-10-24 09:26:23.107702
2	Годовая оценка 2025	2025-01-01	2025-03-31	active	2025-10-24 09:29:58.134448
\.


--
-- TOC entry 3791 (class 0 OID 23626888)
-- Dependencies: 224
-- Data for Name: selected_respondents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.selected_respondents (id, employee_id, respondent_id, task_id, cycle_id, status, created_at) FROM stdin;
\.


--
-- TOC entry 3803 (class 0 OID 23627025)
-- Dependencies: 236
-- Data for Name: self_assessment_questions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.self_assessment_questions (id, question_text, question_type, options, max_score, weight, is_active, display_order, created_at) FROM stdin;
\.


--
-- TOC entry 3805 (class 0 OID 23627038)
-- Dependencies: 238
-- Data for Name: self_assessments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.self_assessments (id, user_id, task_id, cycle_id, question_id, answer_text, answer_score, created_at) FROM stdin;
111	1	1	2	1	\N	3	2025-10-24 13:26:55.083474
112	1	1	2	2	\N	3	2025-10-24 13:26:55.089789
113	1	1	2	3	\N	5	2025-10-24 13:26:55.09125
114	1	1	2	4	\N	3	2025-10-24 13:26:55.092342
115	1	1	2	5	\N	5	2025-10-24 13:26:55.093695
116	2	1	2	1	\N	5	2025-10-24 13:26:55.099783
117	2	1	2	2	\N	4	2025-10-24 13:26:55.101451
118	2	1	2	3	\N	5	2025-10-24 13:26:55.102607
119	2	1	2	4	\N	3	2025-10-24 13:26:55.103689
120	2	1	2	5	\N	5	2025-10-24 13:26:55.104823
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
\.


--
-- TOC entry 3787 (class 0 OID 23626844)
-- Dependencies: 220
-- Data for Name: task_annotations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.task_annotations (id, task_id, annotation_text, source_sheet, created_at) FROM stdin;
\.


--
-- TOC entry 3783 (class 0 OID 23626801)
-- Dependencies: 216
-- Data for Name: task_leads; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.task_leads (id, task_id, user_id, full_name, role_title, notes, created_at) FROM stdin;
\.


--
-- TOC entry 3785 (class 0 OID 23626823)
-- Dependencies: 218
-- Data for Name: task_participants; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.task_participants (id, task_id, user_id, full_name, responsibility_area, is_internal, created_at) FROM stdin;
\.


--
-- TOC entry 3781 (class 0 OID 23626786)
-- Dependencies: 214
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tasks (id, legacy_number, name, description, department, owning_unit, status, notes, created_at, updated_at) FROM stdin;
1	\N	Интеграция Белтелекома	Разработка РИТ	Разработка	\N	active	\N	2025-10-24 09:26:34.352552	2025-10-24 09:26:34.352552
2	\N	Повышение конверсии	Оплата с карточки проекта	Продукт	\N	active	\N	2025-10-24 09:26:34.352552	2025-10-24 09:26:34.352552
3	\N	Главная на своих скрингридах	Обновление главной страницы	Дизайн	\N	active	\N	2025-10-24 09:26:34.352552	2025-10-24 09:26:34.352552
\.


--
-- TOC entry 3833 (class 0 OID 23627477)
-- Dependencies: 266
-- Data for Name: user_review_periods; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_review_periods (id, user_id, cycle_id, start_date, end_date, notification_sent, reminder_sent, status, created_at, updated_at) FROM stdin;
11	9	2	2025-10-20	2025-11-05	t	f	in_progress	2025-10-24 16:49:51.485634	2025-10-24 16:49:51.485634
12	10	2	2025-10-22	2025-11-10	t	f	in_progress	2025-10-24 16:49:51.495963	2025-10-24 16:49:51.495963
13	2	2	2025-10-24	2025-11-10	t	f	in_progress	2025-10-24 16:49:51.499357	2025-10-24 16:49:51.499357
14	11	2	2025-10-01	2025-10-15	t	f	completed	2025-10-24 16:49:51.502161	2025-10-24 16:49:51.502161
15	12	2	2025-11-01	2025-11-15	f	f	pending	2025-10-24 16:49:51.506358	2025-10-24 16:49:51.506358
16	13	2	2025-11-05	2025-11-20	f	f	pending	2025-10-24 16:49:51.510367	2025-10-24 16:49:51.510367
17	1	2	2025-11-10	2025-11-25	f	f	pending	2025-10-24 16:49:51.513638	2025-10-24 16:49:51.513638
18	7	2	2025-11-05	2025-11-20	f	f	pending	2025-10-24 16:49:51.516051	2025-10-24 16:49:51.516051
19	8	2	2025-11-10	2025-11-25	f	f	pending	2025-10-24 16:49:51.519562	2025-10-24 16:49:51.519562
\.


--
-- TOC entry 3777 (class 0 OID 23626753)
-- Dependencies: 210
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, password_hash, first_name, last_name, role, department, "position", manager_id, is_active, created_at, updated_at) FROM stdin;
1	employee@wink.ru	$2a$10$0kGuHzfv0Y47H0QW5rFkfOTM1liYdLYSvj8/WXTMa1.BU4F8EC7im	Иван	Иванов	employee	Разработка	Senior Developer	\N	t	2025-10-24 09:26:11.811493	2025-10-24 09:26:11.811493
2	manager@wink.ru	$2a$10$0kGuHzfv0Y47H0QW5rFkfOTM1liYdLYSvj8/WXTMa1.BU4F8EC7im	Петр	Петров	manager	Разработка	Team Lead	\N	t	2025-10-24 09:26:11.811493	2025-10-24 09:26:11.811493
3	hr@wink.ru	$2a$10$0kGuHzfv0Y47H0QW5rFkfOTM1liYdLYSvj8/WXTMa1.BU4F8EC7im	Мария	Сидорова	hr	HR	HR Manager	\N	t	2025-10-24 09:26:11.811493	2025-10-24 09:26:11.811493
4	admin@wink.ru	$2a$10$0kGuHzfv0Y47H0QW5rFkfOTM1liYdLYSvj8/WXTMa1.BU4F8EC7im	Алексей	Смирнов	admin	IT	System Administrator	\N	t	2025-10-24 09:26:11.811493	2025-10-24 09:26:11.811493
7	manager1@wink.ru	$2a$10$0kGuHzfv0Y47H0QW5rFkfOTM1liYdLYSvj8/WXTMa1.BU4F8EC7im	Кирилл	Менеджеров	manager	Разработка	Team Lead	\N	t	2025-10-24 09:29:58.121543	2025-10-24 09:29:58.121543
8	manager2@wink.ru	$2a$10$0kGuHzfv0Y47H0QW5rFkfOTM1liYdLYSvj8/WXTMa1.BU4F8EC7im	Мария	Петрова	manager	Маркетинг	Marketing Manager	\N	t	2025-10-24 09:29:58.121543	2025-10-24 09:29:58.121543
9	emp1@wink.ru	$2a$10$0kGuHzfv0Y47H0QW5rFkfOTM1liYdLYSvj8/WXTMa1.BU4F8EC7im	Иван	Иванов	employee	Разработка	Senior Developer	7	t	2025-10-24 09:29:58.121543	2025-10-24 09:29:58.121543
10	emp2@wink.ru	$2a$10$0kGuHzfv0Y47H0QW5rFkfOTM1liYdLYSvj8/WXTMa1.BU4F8EC7im	Анна	Сидорова	employee	Разработка	Middle Developer	7	t	2025-10-24 09:29:58.121543	2025-10-24 09:29:58.121543
11	emp3@wink.ru	$2a$10$0kGuHzfv0Y47H0QW5rFkfOTM1liYdLYSvj8/WXTMa1.BU4F8EC7im	Петр	Петров	employee	Разработка	Junior Developer	7	t	2025-10-24 09:29:58.121543	2025-10-24 09:29:58.121543
12	emp4@wink.ru	$2a$10$0kGuHzfv0Y47H0QW5rFkfOTM1liYdLYSvj8/WXTMa1.BU4F8EC7im	Ольга	Васильева	employee	Маркетинг	Marketing Specialist	8	t	2025-10-24 09:29:58.121543	2025-10-24 09:29:58.121543
13	emp5@wink.ru	$2a$10$0kGuHzfv0Y47H0QW5rFkfOTM1liYdLYSvj8/WXTMa1.BU4F8EC7im	Дмитрий	Смирнов	employee	Маркетинг	Content Manager	8	t	2025-10-24 09:29:58.121543	2025-10-24 09:29:58.121543
\.


--
-- TOC entry 3871 (class 0 OID 0)
-- Dependencies: 225
-- Name: employee_goals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.employee_goals_id_seq', 4, true);


--
-- TOC entry 3872 (class 0 OID 0)
-- Dependencies: 257
-- Name: employee_recommendations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.employee_recommendations_id_seq', 1, false);


--
-- TOC entry 3873 (class 0 OID 0)
-- Dependencies: 221
-- Name: employee_tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.employee_tasks_id_seq', 1, false);


--
-- TOC entry 3874 (class 0 OID 0)
-- Dependencies: 253
-- Name: final_reviews_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.final_reviews_id_seq', 1, false);


--
-- TOC entry 3875 (class 0 OID 0)
-- Dependencies: 231
-- Name: form_sections_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.form_sections_id_seq', 1, false);


--
-- TOC entry 3876 (class 0 OID 0)
-- Dependencies: 233
-- Name: form_static_blocks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.form_static_blocks_id_seq', 1, false);


--
-- TOC entry 3877 (class 0 OID 0)
-- Dependencies: 229
-- Name: form_templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.form_templates_id_seq', 1, false);


--
-- TOC entry 3878 (class 0 OID 0)
-- Dependencies: 227
-- Name: goal_tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.goal_tasks_id_seq', 1, false);


--
-- TOC entry 3879 (class 0 OID 0)
-- Dependencies: 263
-- Name: manager_evaluations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.manager_evaluations_id_seq', 24, true);


--
-- TOC entry 3880 (class 0 OID 0)
-- Dependencies: 243
-- Name: manager_review_questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.manager_review_questions_id_seq', 6, true);


--
-- TOC entry 3881 (class 0 OID 0)
-- Dependencies: 245
-- Name: manager_reviews_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.manager_reviews_id_seq', 30, true);


--
-- TOC entry 3882 (class 0 OID 0)
-- Dependencies: 267
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notifications_id_seq', 1, false);


--
-- TOC entry 3883 (class 0 OID 0)
-- Dependencies: 259
-- Name: peer_feedback_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.peer_feedback_requests_id_seq', 3, true);


--
-- TOC entry 3884 (class 0 OID 0)
-- Dependencies: 261
-- Name: peer_feedbacks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.peer_feedbacks_id_seq', 2, true);


--
-- TOC entry 3885 (class 0 OID 0)
-- Dependencies: 239
-- Name: peer_review_questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.peer_review_questions_id_seq', 5, true);


--
-- TOC entry 3886 (class 0 OID 0)
-- Dependencies: 241
-- Name: peer_reviews_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.peer_reviews_id_seq', 46, true);


--
-- TOC entry 3887 (class 0 OID 0)
-- Dependencies: 247
-- Name: potential_assessments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.potential_assessments_id_seq', 30, true);


--
-- TOC entry 3888 (class 0 OID 0)
-- Dependencies: 251
-- Name: potential_detail_answers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.potential_detail_answers_id_seq', 1, false);


--
-- TOC entry 3889 (class 0 OID 0)
-- Dependencies: 249
-- Name: potential_detail_questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.potential_detail_questions_id_seq', 1, false);


--
-- TOC entry 3890 (class 0 OID 0)
-- Dependencies: 255
-- Name: recommendation_triggers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.recommendation_triggers_id_seq', 1, false);


--
-- TOC entry 3891 (class 0 OID 0)
-- Dependencies: 211
-- Name: review_cycles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.review_cycles_id_seq', 2, true);


--
-- TOC entry 3892 (class 0 OID 0)
-- Dependencies: 223
-- Name: selected_respondents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.selected_respondents_id_seq', 1, false);


--
-- TOC entry 3893 (class 0 OID 0)
-- Dependencies: 235
-- Name: self_assessment_questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.self_assessment_questions_id_seq', 1, false);


--
-- TOC entry 3894 (class 0 OID 0)
-- Dependencies: 237
-- Name: self_assessments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.self_assessments_id_seq', 150, true);


--
-- TOC entry 3895 (class 0 OID 0)
-- Dependencies: 219
-- Name: task_annotations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.task_annotations_id_seq', 1, false);


--
-- TOC entry 3896 (class 0 OID 0)
-- Dependencies: 215
-- Name: task_leads_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.task_leads_id_seq', 1, false);


--
-- TOC entry 3897 (class 0 OID 0)
-- Dependencies: 217
-- Name: task_participants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.task_participants_id_seq', 1, false);


--
-- TOC entry 3898 (class 0 OID 0)
-- Dependencies: 213
-- Name: tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tasks_id_seq', 3, true);


--
-- TOC entry 3899 (class 0 OID 0)
-- Dependencies: 265
-- Name: user_review_periods_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_review_periods_id_seq', 19, true);


--
-- TOC entry 3900 (class 0 OID 0)
-- Dependencies: 209
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 13, true);


--
-- TOC entry 3481 (class 2606 OID 23626934)
-- Name: employee_goals employee_goals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_goals
    ADD CONSTRAINT employee_goals_pkey PRIMARY KEY (id);


--
-- TOC entry 3483 (class 2606 OID 23626936)
-- Name: employee_goals employee_goals_user_id_cycle_id_goal_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_goals
    ADD CONSTRAINT employee_goals_user_id_cycle_id_goal_number_key UNIQUE (user_id, cycle_id, goal_number);


--
-- TOC entry 3548 (class 2606 OID 23627303)
-- Name: employee_recommendations employee_recommendations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_recommendations
    ADD CONSTRAINT employee_recommendations_pkey PRIMARY KEY (id);


--
-- TOC entry 3469 (class 2606 OID 23626867)
-- Name: employee_tasks employee_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_tasks
    ADD CONSTRAINT employee_tasks_pkey PRIMARY KEY (id);


--
-- TOC entry 3471 (class 2606 OID 23626869)
-- Name: employee_tasks employee_tasks_user_id_cycle_id_task_order_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_tasks
    ADD CONSTRAINT employee_tasks_user_id_cycle_id_task_order_key UNIQUE (user_id, cycle_id, task_order);


--
-- TOC entry 3539 (class 2606 OID 23627269)
-- Name: final_reviews final_reviews_employee_id_cycle_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.final_reviews
    ADD CONSTRAINT final_reviews_employee_id_cycle_id_key UNIQUE (employee_id, cycle_id);


--
-- TOC entry 3541 (class 2606 OID 23627267)
-- Name: final_reviews final_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.final_reviews
    ADD CONSTRAINT final_reviews_pkey PRIMARY KEY (id);


--
-- TOC entry 3496 (class 2606 OID 23626997)
-- Name: form_sections form_sections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_sections
    ADD CONSTRAINT form_sections_pkey PRIMARY KEY (id);


--
-- TOC entry 3498 (class 2606 OID 23627013)
-- Name: form_static_blocks form_static_blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_static_blocks
    ADD CONSTRAINT form_static_blocks_pkey PRIMARY KEY (id);


--
-- TOC entry 3492 (class 2606 OID 23626984)
-- Name: form_templates form_templates_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_templates
    ADD CONSTRAINT form_templates_code_key UNIQUE (code);


--
-- TOC entry 3494 (class 2606 OID 23626982)
-- Name: form_templates form_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_templates
    ADD CONSTRAINT form_templates_pkey PRIMARY KEY (id);


--
-- TOC entry 3487 (class 2606 OID 23626961)
-- Name: goal_tasks goal_tasks_goal_id_task_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goal_tasks
    ADD CONSTRAINT goal_tasks_goal_id_task_number_key UNIQUE (goal_id, task_number);


--
-- TOC entry 3489 (class 2606 OID 23626959)
-- Name: goal_tasks goal_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goal_tasks
    ADD CONSTRAINT goal_tasks_pkey PRIMARY KEY (id);


--
-- TOC entry 3563 (class 2606 OID 23627439)
-- Name: manager_evaluations manager_evaluations_employee_id_manager_id_cycle_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manager_evaluations
    ADD CONSTRAINT manager_evaluations_employee_id_manager_id_cycle_id_key UNIQUE (employee_id, manager_id, cycle_id);


--
-- TOC entry 3565 (class 2606 OID 23627437)
-- Name: manager_evaluations manager_evaluations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manager_evaluations
    ADD CONSTRAINT manager_evaluations_pkey PRIMARY KEY (id);


--
-- TOC entry 3515 (class 2606 OID 23627134)
-- Name: manager_review_questions manager_review_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manager_review_questions
    ADD CONSTRAINT manager_review_questions_pkey PRIMARY KEY (id);


--
-- TOC entry 3519 (class 2606 OID 23627146)
-- Name: manager_reviews manager_reviews_employee_id_task_id_cycle_id_question_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manager_reviews
    ADD CONSTRAINT manager_reviews_employee_id_task_id_cycle_id_question_id_key UNIQUE (employee_id, task_id, cycle_id, question_id);


--
-- TOC entry 3521 (class 2606 OID 23627144)
-- Name: manager_reviews manager_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manager_reviews
    ADD CONSTRAINT manager_reviews_pkey PRIMARY KEY (id);


--
-- TOC entry 3579 (class 2606 OID 23627515)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- TOC entry 3551 (class 2606 OID 23627331)
-- Name: peer_feedback_requests peer_feedback_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.peer_feedback_requests
    ADD CONSTRAINT peer_feedback_requests_pkey PRIMARY KEY (id);


--
-- TOC entry 3553 (class 2606 OID 23627333)
-- Name: peer_feedback_requests peer_feedback_requests_requester_id_reviewer_id_cycle_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.peer_feedback_requests
    ADD CONSTRAINT peer_feedback_requests_requester_id_reviewer_id_cycle_id_key UNIQUE (requester_id, reviewer_id, cycle_id);


--
-- TOC entry 3555 (class 2606 OID 23627364)
-- Name: peer_feedbacks peer_feedbacks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.peer_feedbacks
    ADD CONSTRAINT peer_feedbacks_pkey PRIMARY KEY (id);


--
-- TOC entry 3507 (class 2606 OID 23627082)
-- Name: peer_review_questions peer_review_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.peer_review_questions
    ADD CONSTRAINT peer_review_questions_pkey PRIMARY KEY (id);


--
-- TOC entry 3511 (class 2606 OID 23627094)
-- Name: peer_reviews peer_reviews_employee_id_respondent_id_task_id_cycle_id_que_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.peer_reviews
    ADD CONSTRAINT peer_reviews_employee_id_respondent_id_task_id_cycle_id_que_key UNIQUE (employee_id, respondent_id, task_id, cycle_id, question_id);


--
-- TOC entry 3513 (class 2606 OID 23627092)
-- Name: peer_reviews peer_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.peer_reviews
    ADD CONSTRAINT peer_reviews_pkey PRIMARY KEY (id);


--
-- TOC entry 3528 (class 2606 OID 23627198)
-- Name: potential_assessments potential_assessments_employee_id_cycle_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.potential_assessments
    ADD CONSTRAINT potential_assessments_employee_id_cycle_id_key UNIQUE (employee_id, cycle_id);


--
-- TOC entry 3530 (class 2606 OID 23627196)
-- Name: potential_assessments potential_assessments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.potential_assessments
    ADD CONSTRAINT potential_assessments_pkey PRIMARY KEY (id);


--
-- TOC entry 3535 (class 2606 OID 23627240)
-- Name: potential_detail_answers potential_detail_answers_assessment_id_question_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.potential_detail_answers
    ADD CONSTRAINT potential_detail_answers_assessment_id_question_id_key UNIQUE (assessment_id, question_id);


--
-- TOC entry 3537 (class 2606 OID 23627238)
-- Name: potential_detail_answers potential_detail_answers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.potential_detail_answers
    ADD CONSTRAINT potential_detail_answers_pkey PRIMARY KEY (id);


--
-- TOC entry 3532 (class 2606 OID 23627228)
-- Name: potential_detail_questions potential_detail_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.potential_detail_questions
    ADD CONSTRAINT potential_detail_questions_pkey PRIMARY KEY (id);


--
-- TOC entry 3546 (class 2606 OID 23627292)
-- Name: recommendation_triggers recommendation_triggers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recommendation_triggers
    ADD CONSTRAINT recommendation_triggers_pkey PRIMARY KEY (id);


--
-- TOC entry 3453 (class 2606 OID 23626784)
-- Name: review_cycles review_cycles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_cycles
    ADD CONSTRAINT review_cycles_pkey PRIMARY KEY (id);


--
-- TOC entry 3477 (class 2606 OID 23626898)
-- Name: selected_respondents selected_respondents_employee_id_respondent_id_task_id_cycl_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selected_respondents
    ADD CONSTRAINT selected_respondents_employee_id_respondent_id_task_id_cycl_key UNIQUE (employee_id, respondent_id, task_id, cycle_id);


--
-- TOC entry 3479 (class 2606 OID 23626896)
-- Name: selected_respondents selected_respondents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selected_respondents
    ADD CONSTRAINT selected_respondents_pkey PRIMARY KEY (id);


--
-- TOC entry 3500 (class 2606 OID 23627036)
-- Name: self_assessment_questions self_assessment_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.self_assessment_questions
    ADD CONSTRAINT self_assessment_questions_pkey PRIMARY KEY (id);


--
-- TOC entry 3503 (class 2606 OID 23627046)
-- Name: self_assessments self_assessments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.self_assessments
    ADD CONSTRAINT self_assessments_pkey PRIMARY KEY (id);


--
-- TOC entry 3505 (class 2606 OID 23627048)
-- Name: self_assessments self_assessments_user_id_task_id_cycle_id_question_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.self_assessments
    ADD CONSTRAINT self_assessments_user_id_task_id_cycle_id_question_id_key UNIQUE (user_id, task_id, cycle_id, question_id);


--
-- TOC entry 3467 (class 2606 OID 23626853)
-- Name: task_annotations task_annotations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_annotations
    ADD CONSTRAINT task_annotations_pkey PRIMARY KEY (id);


--
-- TOC entry 3459 (class 2606 OID 23626809)
-- Name: task_leads task_leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_leads
    ADD CONSTRAINT task_leads_pkey PRIMARY KEY (id);


--
-- TOC entry 3461 (class 2606 OID 23626811)
-- Name: task_leads task_leads_task_id_full_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_leads
    ADD CONSTRAINT task_leads_task_id_full_name_key UNIQUE (task_id, full_name);


--
-- TOC entry 3463 (class 2606 OID 23626830)
-- Name: task_participants task_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_participants
    ADD CONSTRAINT task_participants_pkey PRIMARY KEY (id);


--
-- TOC entry 3465 (class 2606 OID 23626832)
-- Name: task_participants task_participants_task_id_full_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_participants
    ADD CONSTRAINT task_participants_task_id_full_name_key UNIQUE (task_id, full_name);


--
-- TOC entry 3457 (class 2606 OID 23626797)
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- TOC entry 3571 (class 2606 OID 23627488)
-- Name: user_review_periods user_review_periods_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_review_periods
    ADD CONSTRAINT user_review_periods_pkey PRIMARY KEY (id);


--
-- TOC entry 3573 (class 2606 OID 23627490)
-- Name: user_review_periods user_review_periods_user_id_cycle_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_review_periods
    ADD CONSTRAINT user_review_periods_user_id_cycle_id_key UNIQUE (user_id, cycle_id);


--
-- TOC entry 3449 (class 2606 OID 23626766)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 3451 (class 2606 OID 23626764)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3472 (class 1259 OID 23626886)
-- Name: idx_employee_tasks_cycle; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employee_tasks_cycle ON public.employee_tasks USING btree (cycle_id);


--
-- TOC entry 3473 (class 1259 OID 23626885)
-- Name: idx_employee_tasks_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employee_tasks_user ON public.employee_tasks USING btree (user_id);


--
-- TOC entry 3542 (class 1259 OID 23627280)
-- Name: idx_final_review_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_final_review_employee ON public.final_reviews USING btree (employee_id);


--
-- TOC entry 3543 (class 1259 OID 23627281)
-- Name: idx_final_review_rating; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_final_review_rating ON public.final_reviews USING btree (rating_category);


--
-- TOC entry 3490 (class 1259 OID 23626967)
-- Name: idx_goal_tasks_goal; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_goal_tasks_goal ON public.goal_tasks USING btree (goal_id);


--
-- TOC entry 3484 (class 1259 OID 23626948)
-- Name: idx_goals_cycle; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_goals_cycle ON public.employee_goals USING btree (cycle_id);


--
-- TOC entry 3485 (class 1259 OID 23626947)
-- Name: idx_goals_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_goals_user ON public.employee_goals USING btree (user_id);


--
-- TOC entry 3556 (class 1259 OID 23627457)
-- Name: idx_manager_eval_cycle; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_manager_eval_cycle ON public.manager_evaluations USING btree (cycle_id);


--
-- TOC entry 3557 (class 1259 OID 23627455)
-- Name: idx_manager_eval_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_manager_eval_employee ON public.manager_evaluations USING btree (employee_id);


--
-- TOC entry 3558 (class 1259 OID 23627456)
-- Name: idx_manager_eval_manager; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_manager_eval_manager ON public.manager_evaluations USING btree (manager_id);


--
-- TOC entry 3559 (class 1259 OID 23627467)
-- Name: idx_manager_evaluations_cycle; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_manager_evaluations_cycle ON public.manager_evaluations USING btree (cycle_id);


--
-- TOC entry 3560 (class 1259 OID 23627465)
-- Name: idx_manager_evaluations_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_manager_evaluations_employee ON public.manager_evaluations USING btree (employee_id);


--
-- TOC entry 3561 (class 1259 OID 23627466)
-- Name: idx_manager_evaluations_manager; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_manager_evaluations_manager ON public.manager_evaluations USING btree (manager_id);


--
-- TOC entry 3516 (class 1259 OID 23627172)
-- Name: idx_manager_review_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_manager_review_employee ON public.manager_reviews USING btree (employee_id);


--
-- TOC entry 3517 (class 1259 OID 23627173)
-- Name: idx_manager_review_manager; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_manager_review_manager ON public.manager_reviews USING btree (manager_id);


--
-- TOC entry 3574 (class 1259 OID 23627528)
-- Name: idx_notifications_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (created_at);


--
-- TOC entry 3575 (class 1259 OID 23627527)
-- Name: idx_notifications_is_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_is_read ON public.notifications USING btree (is_read);


--
-- TOC entry 3576 (class 1259 OID 23627529)
-- Name: idx_notifications_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_type ON public.notifications USING btree (type);


--
-- TOC entry 3577 (class 1259 OID 23627526)
-- Name: idx_notifications_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);


--
-- TOC entry 3508 (class 1259 OID 23627120)
-- Name: idx_peer_review_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_peer_review_employee ON public.peer_reviews USING btree (employee_id);


--
-- TOC entry 3509 (class 1259 OID 23627121)
-- Name: idx_peer_review_respondent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_peer_review_respondent ON public.peer_reviews USING btree (respondent_id);


--
-- TOC entry 3533 (class 1259 OID 23627251)
-- Name: idx_potential_answers_assessment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_potential_answers_assessment ON public.potential_detail_answers USING btree (assessment_id);


--
-- TOC entry 3522 (class 1259 OID 23627462)
-- Name: idx_potential_assessments_cycle; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_potential_assessments_cycle ON public.potential_assessments USING btree (cycle_id);


--
-- TOC entry 3523 (class 1259 OID 23627460)
-- Name: idx_potential_assessments_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_potential_assessments_employee ON public.potential_assessments USING btree (employee_id);


--
-- TOC entry 3524 (class 1259 OID 23627461)
-- Name: idx_potential_assessments_manager; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_potential_assessments_manager ON public.potential_assessments USING btree (manager_id);


--
-- TOC entry 3525 (class 1259 OID 23627463)
-- Name: idx_potential_box; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_potential_box ON public.potential_assessments USING btree (box_position);


--
-- TOC entry 3526 (class 1259 OID 23627214)
-- Name: idx_potential_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_potential_employee ON public.potential_assessments USING btree (employee_id);


--
-- TOC entry 3549 (class 1259 OID 23627319)
-- Name: idx_recommendations_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recommendations_employee ON public.employee_recommendations USING btree (employee_id);


--
-- TOC entry 3474 (class 1259 OID 23626919)
-- Name: idx_respondents_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_respondents_employee ON public.selected_respondents USING btree (employee_id);


--
-- TOC entry 3475 (class 1259 OID 23626920)
-- Name: idx_respondents_respondent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_respondents_respondent ON public.selected_respondents USING btree (respondent_id);


--
-- TOC entry 3501 (class 1259 OID 23627069)
-- Name: idx_self_assessment_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_self_assessment_user ON public.self_assessments USING btree (user_id);


--
-- TOC entry 3454 (class 1259 OID 23626798)
-- Name: idx_tasks_department; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_department ON public.tasks USING btree (department);


--
-- TOC entry 3455 (class 1259 OID 23626799)
-- Name: idx_tasks_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_status ON public.tasks USING btree (status);


--
-- TOC entry 3544 (class 1259 OID 23627293)
-- Name: idx_triggers_word; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_triggers_word ON public.recommendation_triggers USING btree (trigger_word);


--
-- TOC entry 3566 (class 1259 OID 23627502)
-- Name: idx_user_review_periods_cycle_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_review_periods_cycle_id ON public.user_review_periods USING btree (cycle_id);


--
-- TOC entry 3567 (class 1259 OID 23627503)
-- Name: idx_user_review_periods_dates; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_review_periods_dates ON public.user_review_periods USING btree (start_date, end_date);


--
-- TOC entry 3568 (class 1259 OID 23627504)
-- Name: idx_user_review_periods_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_review_periods_status ON public.user_review_periods USING btree (status);


--
-- TOC entry 3569 (class 1259 OID 23627501)
-- Name: idx_user_review_periods_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_review_periods_user_id ON public.user_review_periods USING btree (user_id);


--
-- TOC entry 3445 (class 1259 OID 23626774)
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- TOC entry 3446 (class 1259 OID 23626773)
-- Name: idx_users_manager; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_manager ON public.users USING btree (manager_id);


--
-- TOC entry 3447 (class 1259 OID 23626772)
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- TOC entry 3593 (class 2606 OID 23626942)
-- Name: employee_goals employee_goals_cycle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_goals
    ADD CONSTRAINT employee_goals_cycle_id_fkey FOREIGN KEY (cycle_id) REFERENCES public.review_cycles(id);


--
-- TOC entry 3594 (class 2606 OID 23626937)
-- Name: employee_goals employee_goals_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_goals
    ADD CONSTRAINT employee_goals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 3619 (class 2606 OID 23627314)
-- Name: employee_recommendations employee_recommendations_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_recommendations
    ADD CONSTRAINT employee_recommendations_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 3620 (class 2606 OID 23627309)
-- Name: employee_recommendations employee_recommendations_cycle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_recommendations
    ADD CONSTRAINT employee_recommendations_cycle_id_fkey FOREIGN KEY (cycle_id) REFERENCES public.review_cycles(id);


--
-- TOC entry 3621 (class 2606 OID 23627304)
-- Name: employee_recommendations employee_recommendations_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_recommendations
    ADD CONSTRAINT employee_recommendations_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.users(id);


--
-- TOC entry 3586 (class 2606 OID 23626880)
-- Name: employee_tasks employee_tasks_cycle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_tasks
    ADD CONSTRAINT employee_tasks_cycle_id_fkey FOREIGN KEY (cycle_id) REFERENCES public.review_cycles(id);


--
-- TOC entry 3587 (class 2606 OID 23626875)
-- Name: employee_tasks employee_tasks_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_tasks
    ADD CONSTRAINT employee_tasks_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id);


--
-- TOC entry 3588 (class 2606 OID 23626870)
-- Name: employee_tasks employee_tasks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_tasks
    ADD CONSTRAINT employee_tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 3617 (class 2606 OID 23627275)
-- Name: final_reviews final_reviews_cycle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.final_reviews
    ADD CONSTRAINT final_reviews_cycle_id_fkey FOREIGN KEY (cycle_id) REFERENCES public.review_cycles(id);


--
-- TOC entry 3618 (class 2606 OID 23627270)
-- Name: final_reviews final_reviews_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.final_reviews
    ADD CONSTRAINT final_reviews_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.users(id);


--
-- TOC entry 3596 (class 2606 OID 23626998)
-- Name: form_sections form_sections_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_sections
    ADD CONSTRAINT form_sections_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.form_templates(id) ON DELETE CASCADE;


--
-- TOC entry 3597 (class 2606 OID 23627019)
-- Name: form_static_blocks form_static_blocks_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_static_blocks
    ADD CONSTRAINT form_static_blocks_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.form_sections(id) ON DELETE CASCADE;


--
-- TOC entry 3598 (class 2606 OID 23627014)
-- Name: form_static_blocks form_static_blocks_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_static_blocks
    ADD CONSTRAINT form_static_blocks_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.form_templates(id) ON DELETE CASCADE;


--
-- TOC entry 3595 (class 2606 OID 23626962)
-- Name: goal_tasks goal_tasks_goal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goal_tasks
    ADD CONSTRAINT goal_tasks_goal_id_fkey FOREIGN KEY (goal_id) REFERENCES public.employee_goals(id) ON DELETE CASCADE;


--
-- TOC entry 3629 (class 2606 OID 23627450)
-- Name: manager_evaluations manager_evaluations_cycle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manager_evaluations
    ADD CONSTRAINT manager_evaluations_cycle_id_fkey FOREIGN KEY (cycle_id) REFERENCES public.review_cycles(id) ON DELETE CASCADE;


--
-- TOC entry 3630 (class 2606 OID 23627440)
-- Name: manager_evaluations manager_evaluations_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manager_evaluations
    ADD CONSTRAINT manager_evaluations_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3631 (class 2606 OID 23627471)
-- Name: manager_evaluations manager_evaluations_goal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manager_evaluations
    ADD CONSTRAINT manager_evaluations_goal_id_fkey FOREIGN KEY (goal_id) REFERENCES public.employee_goals(id);


--
-- TOC entry 3632 (class 2606 OID 23627445)
-- Name: manager_evaluations manager_evaluations_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manager_evaluations
    ADD CONSTRAINT manager_evaluations_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3607 (class 2606 OID 23627162)
-- Name: manager_reviews manager_reviews_cycle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manager_reviews
    ADD CONSTRAINT manager_reviews_cycle_id_fkey FOREIGN KEY (cycle_id) REFERENCES public.review_cycles(id);


--
-- TOC entry 3608 (class 2606 OID 23627147)
-- Name: manager_reviews manager_reviews_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manager_reviews
    ADD CONSTRAINT manager_reviews_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.users(id);


--
-- TOC entry 3609 (class 2606 OID 23627152)
-- Name: manager_reviews manager_reviews_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manager_reviews
    ADD CONSTRAINT manager_reviews_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.users(id);


--
-- TOC entry 3610 (class 2606 OID 23627167)
-- Name: manager_reviews manager_reviews_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manager_reviews
    ADD CONSTRAINT manager_reviews_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.manager_review_questions(id);


--
-- TOC entry 3611 (class 2606 OID 23627157)
-- Name: manager_reviews manager_reviews_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manager_reviews
    ADD CONSTRAINT manager_reviews_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id);


--
-- TOC entry 3635 (class 2606 OID 23627521)
-- Name: notifications notifications_related_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_related_user_id_fkey FOREIGN KEY (related_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 3636 (class 2606 OID 23627516)
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3622 (class 2606 OID 23627344)
-- Name: peer_feedback_requests peer_feedback_requests_cycle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.peer_feedback_requests
    ADD CONSTRAINT peer_feedback_requests_cycle_id_fkey FOREIGN KEY (cycle_id) REFERENCES public.review_cycles(id) ON DELETE CASCADE;


--
-- TOC entry 3623 (class 2606 OID 23627334)
-- Name: peer_feedback_requests peer_feedback_requests_requester_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.peer_feedback_requests
    ADD CONSTRAINT peer_feedback_requests_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3624 (class 2606 OID 23627339)
-- Name: peer_feedback_requests peer_feedback_requests_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.peer_feedback_requests
    ADD CONSTRAINT peer_feedback_requests_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3625 (class 2606 OID 23627380)
-- Name: peer_feedbacks peer_feedbacks_cycle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.peer_feedbacks
    ADD CONSTRAINT peer_feedbacks_cycle_id_fkey FOREIGN KEY (cycle_id) REFERENCES public.review_cycles(id) ON DELETE CASCADE;


--
-- TOC entry 3626 (class 2606 OID 23627365)
-- Name: peer_feedbacks peer_feedbacks_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.peer_feedbacks
    ADD CONSTRAINT peer_feedbacks_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.peer_feedback_requests(id) ON DELETE CASCADE;


--
-- TOC entry 3627 (class 2606 OID 23627370)
-- Name: peer_feedbacks peer_feedbacks_requester_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.peer_feedbacks
    ADD CONSTRAINT peer_feedbacks_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3628 (class 2606 OID 23627375)
-- Name: peer_feedbacks peer_feedbacks_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.peer_feedbacks
    ADD CONSTRAINT peer_feedbacks_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3602 (class 2606 OID 23627110)
-- Name: peer_reviews peer_reviews_cycle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.peer_reviews
    ADD CONSTRAINT peer_reviews_cycle_id_fkey FOREIGN KEY (cycle_id) REFERENCES public.review_cycles(id);


--
-- TOC entry 3603 (class 2606 OID 23627095)
-- Name: peer_reviews peer_reviews_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.peer_reviews
    ADD CONSTRAINT peer_reviews_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.users(id);


--
-- TOC entry 3604 (class 2606 OID 23627115)
-- Name: peer_reviews peer_reviews_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.peer_reviews
    ADD CONSTRAINT peer_reviews_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.peer_review_questions(id);


--
-- TOC entry 3605 (class 2606 OID 23627100)
-- Name: peer_reviews peer_reviews_respondent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.peer_reviews
    ADD CONSTRAINT peer_reviews_respondent_id_fkey FOREIGN KEY (respondent_id) REFERENCES public.users(id);


--
-- TOC entry 3606 (class 2606 OID 23627105)
-- Name: peer_reviews peer_reviews_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.peer_reviews
    ADD CONSTRAINT peer_reviews_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id);


--
-- TOC entry 3612 (class 2606 OID 23627209)
-- Name: potential_assessments potential_assessments_cycle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.potential_assessments
    ADD CONSTRAINT potential_assessments_cycle_id_fkey FOREIGN KEY (cycle_id) REFERENCES public.review_cycles(id);


--
-- TOC entry 3613 (class 2606 OID 23627199)
-- Name: potential_assessments potential_assessments_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.potential_assessments
    ADD CONSTRAINT potential_assessments_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.users(id);


--
-- TOC entry 3614 (class 2606 OID 23627204)
-- Name: potential_assessments potential_assessments_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.potential_assessments
    ADD CONSTRAINT potential_assessments_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.users(id);


--
-- TOC entry 3615 (class 2606 OID 23627241)
-- Name: potential_detail_answers potential_detail_answers_assessment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.potential_detail_answers
    ADD CONSTRAINT potential_detail_answers_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES public.potential_assessments(id) ON DELETE CASCADE;


--
-- TOC entry 3616 (class 2606 OID 23627246)
-- Name: potential_detail_answers potential_detail_answers_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.potential_detail_answers
    ADD CONSTRAINT potential_detail_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.potential_detail_questions(id);


--
-- TOC entry 3589 (class 2606 OID 23626914)
-- Name: selected_respondents selected_respondents_cycle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selected_respondents
    ADD CONSTRAINT selected_respondents_cycle_id_fkey FOREIGN KEY (cycle_id) REFERENCES public.review_cycles(id);


--
-- TOC entry 3590 (class 2606 OID 23626899)
-- Name: selected_respondents selected_respondents_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selected_respondents
    ADD CONSTRAINT selected_respondents_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.users(id);


--
-- TOC entry 3591 (class 2606 OID 23626904)
-- Name: selected_respondents selected_respondents_respondent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selected_respondents
    ADD CONSTRAINT selected_respondents_respondent_id_fkey FOREIGN KEY (respondent_id) REFERENCES public.users(id);


--
-- TOC entry 3592 (class 2606 OID 23626909)
-- Name: selected_respondents selected_respondents_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selected_respondents
    ADD CONSTRAINT selected_respondents_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id);


--
-- TOC entry 3599 (class 2606 OID 23627059)
-- Name: self_assessments self_assessments_cycle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.self_assessments
    ADD CONSTRAINT self_assessments_cycle_id_fkey FOREIGN KEY (cycle_id) REFERENCES public.review_cycles(id);


--
-- TOC entry 3600 (class 2606 OID 23627054)
-- Name: self_assessments self_assessments_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.self_assessments
    ADD CONSTRAINT self_assessments_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id);


--
-- TOC entry 3601 (class 2606 OID 23627049)
-- Name: self_assessments self_assessments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.self_assessments
    ADD CONSTRAINT self_assessments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 3585 (class 2606 OID 23626854)
-- Name: task_annotations task_annotations_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_annotations
    ADD CONSTRAINT task_annotations_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- TOC entry 3581 (class 2606 OID 23626812)
-- Name: task_leads task_leads_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_leads
    ADD CONSTRAINT task_leads_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- TOC entry 3582 (class 2606 OID 23626817)
-- Name: task_leads task_leads_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_leads
    ADD CONSTRAINT task_leads_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 3583 (class 2606 OID 23626833)
-- Name: task_participants task_participants_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_participants
    ADD CONSTRAINT task_participants_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- TOC entry 3584 (class 2606 OID 23626838)
-- Name: task_participants task_participants_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_participants
    ADD CONSTRAINT task_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 3633 (class 2606 OID 23627496)
-- Name: user_review_periods user_review_periods_cycle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_review_periods
    ADD CONSTRAINT user_review_periods_cycle_id_fkey FOREIGN KEY (cycle_id) REFERENCES public.review_cycles(id) ON DELETE CASCADE;


--
-- TOC entry 3634 (class 2606 OID 23627491)
-- Name: user_review_periods user_review_periods_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_review_periods
    ADD CONSTRAINT user_review_periods_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3580 (class 2606 OID 23626767)
-- Name: users users_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.users(id);


-- Completed on 2025-10-24 17:49:39

--
-- PostgreSQL database dump complete
--

