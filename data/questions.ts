import type { Question } from '@/types';

// ─── Offline question bank (fallback, not a stub) ─────────────────────
// Used ONLY when the backend bank is unreachable: questions.service.ts
// tries the API first and falls back here, matched by course CODE
// (stable across environments, unlike ids). Deliberately sparse so the
// "nothing here yet" state stays reachable offline too. Course metadata
// (MOCK_COURSES) is gone — the session store owns courses now.

export const OFFLINE_QUESTIONS: Question[] = [
  // ── CSC 301 · 300L · Processes & Threads ──
  {
    id: 'q1', courseId: 'c1', courseCode: 'CSC 301', year: '300L', topic: 'Processes & Threads',
    prompt: 'Which of the following is shared by all threads of the same process?',
    options: ['The stack', 'The program counter', 'The address space', 'The register set'],
    answerIndex: 2,
    explanation: 'Threads share code, data and the address space; each gets its own stack, registers and program counter.',
  },
  {
    id: 'q2', courseId: 'c1', courseCode: 'CSC 301', year: '300L', topic: 'Processes & Threads',
    prompt: 'A process in the "ready" state is one that…',
    options: [
      'is currently executing on the CPU',
      'is waiting for an I/O operation to complete',
      'can run but is waiting to be scheduled',
      'has finished and is being torn down',
    ],
    answerIndex: 2,
    explanation: '"Ready" means runnable — the scheduler just has not handed it the CPU yet.',
  },
  // ── CSC 301 · 300L · CPU Scheduling ──
  {
    id: 'q3', courseId: 'c1', courseCode: 'CSC 301', year: '300L', topic: 'CPU Scheduling',
    prompt: 'Which scheduling algorithm can starve a long-running process indefinitely?',
    options: ['First Come First Served', 'Shortest Job First', 'Round Robin', 'Multilevel Feedback Queue'],
    answerIndex: 1,
    explanation: 'Shortest Job First keeps favouring short bursts, so a long job can wait forever.',
  },
  {
    id: 'q4', courseId: 'c1', courseCode: 'CSC 301', year: '300L', topic: 'CPU Scheduling',
    prompt: 'Round Robin scheduling is characterised mainly by…',
    options: [
      'a fixed time quantum per process',
      'priority assigned by the user',
      'batch execution with no preemption',
      'a single queue processed to completion',
    ],
    answerIndex: 0,
    explanation: 'Each ready process runs for one quantum, then returns to the tail of the queue.',
  },
  {
    id: 'q5', courseId: 'c1', courseCode: 'CSC 301', year: '300L', topic: 'CPU Scheduling',
    prompt: 'Turnaround time is best defined as…',
    options: [
      'the time from arrival to completion',
      'the time spent waiting in the ready queue',
      'the time spent doing I/O only',
      'the length of one scheduling quantum',
    ],
    answerIndex: 0,
    explanation: 'Turnaround = completion − arrival. Waiting time excludes CPU and I/O service time.',
  },
  // ── CSC 301 · 300L · Memory Management ──
  {
    id: 'q6', courseId: 'c1', courseCode: 'CSC 301', year: '300L', topic: 'Memory Management',
    prompt: 'Thrashing in a paging system is caused by…',
    options: [
      'too few frames for the working set',
      'too large a page size',
      'a missing TLB entry',
      'an oversized swap partition',
    ],
    answerIndex: 0,
    explanation: 'When the resident set cannot hold the working set, the system pages instead of executing.',
  },
  // ── CSC 303 · 200L · Trees & Graphs ──
  {
    id: 'q7', courseId: 'c2', courseCode: 'CSC 303', year: '200L', topic: 'Trees',
    prompt: 'What is the height of a balanced binary search tree holding n nodes?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
    answerIndex: 1,
    explanation: 'Balance keeps the depth logarithmic in the node count.',
  },
  {
    id: 'q8', courseId: 'c2', courseCode: 'CSC 303', year: '200L', topic: 'Graphs',
    prompt: 'Breadth-first search on an unweighted graph finds…',
    options: [
      'the minimum spanning tree',
      'shortest paths in edge count from the source',
      'all cycles in the graph',
      'a topological order always',
    ],
    answerIndex: 1,
    explanation: 'BFS expands level by level, so a node is first reached by a fewest-edges path.',
  },
  {
    id: 'q9', courseId: 'c2', courseCode: 'CSC 303', year: '200L', topic: 'Graphs',
    prompt: 'Depth-first search is the basis for which of these?',
    options: ['Dijkstra’s algorithm', 'Topological sorting', 'Binary search', 'Hashing'],
    answerIndex: 1,
    explanation: 'Topological sort is a DFS post-order reversed; it needs a DAG.',
  },
  {
    id: 'q10', courseId: 'c2', courseCode: 'CSC 303', year: '200L', topic: 'Sorting & Searching',
    prompt: 'Which sorting algorithm has the best worst-case time complexity?',
    options: ['Quick sort', 'Merge sort', 'Insertion sort', 'Bubble sort'],
    answerIndex: 1,
    explanation: 'Merge sort is Θ(n log n) in every case; quick sort degrades to O(n²) on adversarial pivots.',
  },
  // ── CSC 305 · 300L ──
  {
    id: 'q11', courseId: 'c3', courseCode: 'CSC 305', year: '300L', topic: 'Normalisation',
    prompt: 'A relation in 3NF has no…',
    options: [
      'composite keys',
      'partial or transitive dependencies on a key',
      'foreign keys',
      'repeating groups',
    ],
    answerIndex: 1,
    explanation: '3NF removes transitive dependencies once 2NF has removed partial ones.',
  },
  {
    id: 'q12', courseId: 'c3', courseCode: 'CSC 305', year: '300L', topic: 'SQL Queries',
    prompt: 'Which clause filters rows AFTER aggregation?',
    options: ['WHERE', 'HAVING', 'ON', 'ORDER BY'],
    answerIndex: 1,
    explanation: 'WHERE filters rows before grouping; HAVING filters the grouped result.',
  },
  {
    id: 'q13', courseId: 'c3', courseCode: 'CSC 305', year: '300L', topic: 'Transactions',
    prompt: 'The ACID property that guarantees a transaction is all-or-nothing is…',
    options: ['Atomicity', 'Consistency', 'Isolation', 'Durability'],
    answerIndex: 0,
    explanation: 'Atomicity rolls the whole transaction back if any statement fails.',
  },
  // ── CSC 309 · 400L ──
  {
    id: 'q14', courseId: 'c5', courseCode: 'CSC 309', year: '400L', topic: 'OSI Model',
    prompt: 'At which OSI layer do routers primarily operate?',
    options: ['Data link', 'Network', 'Transport', 'Session'],
    answerIndex: 1,
    explanation: 'Routers forward on layer-3 addresses; switches work at layer 2.',
  },
  {
    id: 'q15', courseId: 'c5', courseCode: 'CSC 309', year: '400L', topic: 'TCP/IP',
    prompt: 'Which protocol is connection-oriented and reliable?',
    options: ['UDP', 'TCP', 'ICMP', 'ARP'],
    answerIndex: 1,
    explanation: 'TCP handshakes, sequences and retransmits; UDP does none of that.',
  },
];
