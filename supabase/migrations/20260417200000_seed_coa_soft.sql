-- ==============================================
-- DATABASE SEED UPDATE: Add COA and Soft Computing
-- ==============================================

-- 1. Insert Subject Templates
INSERT INTO public.subject_templates (id, name, code, internal_scored, internal_total, external_total, target_total, priority, focus) VALUES
('coa', 'COA', 'PCCST405', 28, 50, 50, 70, 'make_or_break', 'Microarchitecture, Pipelining, Caches, and DMA'),
('soft', 'Soft Computing', 'PECST496', 32, 50, 50, 70, 'balanced', 'Neural Networks, Fuzzy Logic, Genetic Algorithms')
ON CONFLICT (id) DO NOTHING;


-- 2. Insert Module Templates
INSERT INTO public.module_templates (id, subject_id, title, module_no) VALUES
('coa-m1', 'coa', 'Module 1', 1), ('coa-m2', 'coa', 'Module 2', 2), ('coa-m3', 'coa', 'Module 3', 3), ('coa-m4', 'coa', 'Module 4', 4),
('soft-m1', 'soft', 'Module 1', 1), ('soft-m2', 'soft', 'Module 2', 2), ('soft-m3', 'soft', 'Module 3', 3), ('soft-m4', 'soft', 'Module 4', 4)
ON CONFLICT (id) DO NOTHING;


-- 3. Insert Topic Templates
INSERT INTO public.topic_templates (id, subject_id, module_id, name, sort_order) VALUES
-- COA M1
('coa-1-1','coa','coa-m1','Functional units and basic concepts',1),
('coa-1-2','coa','coa-m1','Memory map and Endianness',2),
('coa-1-3','coa','coa-m1','CISC vs RISC architectures',3),
('coa-1-4','coa','coa-m1','Programming concepts and flow',4),
('coa-1-5','coa','coa-m1','Instruction execution cycle',5),
('coa-1-6','coa','coa-m1','Machine language and addressing modes',6),

-- COA M2
('coa-2-1','coa','coa-m2','Microarchitecture Introduction',7),
('coa-2-2','coa','coa-m2','Single-Cycle Processor Datapath',8),
('coa-2-3','coa','coa-m2','Single Cycle Control',9),
('coa-2-4','coa','coa-m2','Pipelined Data Path',10),
('coa-2-5','coa','coa-m2','Data and Control Hazards',11),
('coa-2-6','coa','coa-m2','Performance Analysis',12),

-- COA M3
('coa-3-1','coa','coa-m3','Memory Systems and performance',13),
('coa-3-2','coa','coa-m3','Caches: mapping and replacement',14),
('coa-3-3','coa','coa-m3','Multiple-Level Caches',15),
('coa-3-4','coa','coa-m3','Virtual Memory and Address Translation',16),
('coa-3-5','coa','coa-m3','Translation Lookaside Buffer (TLB)',17),

-- COA M4
('coa-4-1','coa','coa-m4','Input / Output External Devices',18),
('coa-4-2','coa','coa-m4','Programmed I/O and Interrupt Driven I/O',19),
('coa-4-3','coa','coa-m4','Direct Memory Access (DMA)',20),
('coa-4-4','coa','coa-m4','Embedded I/O Systems',21),
('coa-4-5','coa','coa-m4','Serial I/O and Peripherals',22),

-- Soft Computing M1
('soft-1-1','soft','soft-m1','Difference between Hard & Soft Computing',1),
('soft-1-2','soft','soft-m1','Artificial vs Biological Neurons',2),
('soft-1-3','soft','soft-m1','Activation Functions and Learning',3),
('soft-1-4','soft','soft-m1','McCulloch and Pitts Neuron',4),
('soft-1-5','soft','soft-m1','Perceptron Networks Training',5),
('soft-1-6','soft','soft-m1','Adaptive Linear Neuron',6),

-- Soft Computing M2
('soft-2-1','soft','soft-m2','Fuzzy sets and Properties',7),
('soft-2-2','soft','soft-m2','Fuzzy membership functions',8),
('soft-2-3','soft','soft-m2','Linguistic variables and hedges',9),
('soft-2-4','soft','soft-m2','Fuzzy If-Then Rules',10),
('soft-2-5','soft','soft-m2','Fuzzification and Lamda cuts',11),
('soft-2-6','soft','soft-m2','Mamdani and Sugeno Inference',12),

-- Soft Computing M3
('soft-3-1','soft','soft-m3','Evolutionary Computing Terminologies',13),
('soft-3-2','soft','soft-m3','Concepts of genetic algorithm',14),
('soft-3-3','soft','soft-m3','Coding in genetic algorithm',15),
('soft-3-4','soft','soft-m3','Selection, cross over, mutation',16),
('soft-3-5','soft','soft-m3','Stopping condition',17),

-- Soft Computing M4
('soft-4-1','soft','soft-m4','Multi-objective optimization problem',18),
('soft-4-2','soft','soft-m4','Dominance and pareto-optimality',19),
('soft-4-3','soft','soft-m4','Biological Self-Organization',20),
('soft-4-4','soft','soft-m4','Particle Swarm Optimization',21),
('soft-4-5','soft','soft-m4','Ant Colony Optimization',22)

ON CONFLICT (id) DO NOTHING;
