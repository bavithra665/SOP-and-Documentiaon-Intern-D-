import { useState, useEffect } from 'react';
import { sopService, Quiz, QuizResult, QuizAnalytics, SOP } from '../services/sop';
import { Card, CardHeader, CardBody, Button, Table, useToast } from '../components/ui';

export const Quizzes: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'list' | 'take' | 'results' | 'analytics'>('list');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [sops, setSOPs] = useState<SOP[]>([]);
  const [myResults, setMyResults] = useState<QuizResult[]>([]);
  const [analytics, setAnalytics] = useState<QuizAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [currentAnswers, setCurrentAnswers] = useState<number[]>([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [lastResult, setLastResult] = useState<QuizResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const { showToast } = useToast();

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'list') {
        const [quizzesData, sopsData] = await Promise.all([
          sopService.getQuizzes(),
          sopService.getPublished(),
        ]);
        setQuizzes(quizzesData);
        setSOPs(sopsData);
      } else if (activeTab === 'results') {
        const resultsData = await sopService.getMyQuizResults();
        setMyResults(resultsData);
      } else if (activeTab === 'analytics' && (currentUser.role === 'admin' || currentUser.role === 'manager')) {
        const analyticsData = await sopService.getQuizAnalytics();
        setAnalytics(analyticsData);
      }
    } catch (error) {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQuiz = async () => {
    const sopSelect = document.getElementById('sop-select') as HTMLSelectElement;
    const numQuestionsSelect = document.getElementById('num-questions') as HTMLSelectElement;
    
    if (!sopSelect.value) {
      showToast('Please select an SOP', 'error');
      return;
    }

    setGenerating(true);
    try {
      await sopService.createQuiz(parseInt(sopSelect.value), parseInt(numQuestionsSelect.value));
      showToast('Quiz generated successfully', 'success');
      loadData();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to generate quiz', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleTakeQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setCurrentAnswers(new Array(quiz.questions.length).fill(-1));
    setQuizSubmitted(false);
    setLastResult(null);
    setActiveTab('take');
  };

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    const newAnswers = [...currentAnswers];
    newAnswers[questionIndex] = answerIndex;
    setCurrentAnswers(newAnswers);
  };

  const handleSubmitQuiz = async () => {
    if (!selectedQuiz) return;

    if (currentAnswers.includes(-1)) {
      showToast('Please answer all questions', 'error');
      return;
    }

    try {
      const result = await sopService.submitQuiz(selectedQuiz.id, currentAnswers);
      setLastResult(result);
      setQuizSubmitted(true);
      showToast('Quiz submitted successfully', 'success');
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to submit quiz', 'error');
    }
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const tabs = [
    { id: 'list', label: 'Available Quizzes' },
    { id: 'take', label: 'Take Quiz' },
    { id: 'results', label: 'My Results' },
    { id: 'analytics', label: 'Analytics', adminOnly: true },
  ];

  const filteredTabs = tabs.filter(tab => !tab.adminOnly || currentUser.role === 'admin' || currentUser.role === 'manager');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold text-gray-900">Quiz Management</h1>
        </CardHeader>
        <CardBody>
          <div className="flex space-x-2 border-b">
            {filteredTabs.map((tab) => (
              <button
                key={tab.id as string}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-b-2 border-ocean-600 text-ocean-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      {activeTab === 'list' && (
        <div className="space-y-6">
          {(currentUser.role === 'admin' || currentUser.role === 'manager') && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Generate New Quiz</h2>
              </CardHeader>
              <CardBody className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select SOP</label>
                  <select id="sop-select" className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="">Select an SOP</option>
                    {sops.map(sop => (
                      <option key={sop.id} value={sop.id}>{sop.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Questions</label>
                  <select id="num-questions" className="px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="15">15</option>
                    <option value="20">20</option>
                  </select>
                </div>
                <Button variant="primary" onClick={handleGenerateQuiz} loading={generating}>
                  Generate Quiz
                </Button>
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Available Quizzes</h2>
            </CardHeader>
            <CardBody>
              {quizzes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No quizzes available</div>
              ) : (
                <div className="space-y-4">
                  {quizzes.map((quiz) => (
                    <div key={quiz.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold text-gray-900">{quiz.title}</h3>
                        <p className="text-sm text-gray-600">{quiz.sop_title}</p>
                        <p className="text-xs text-gray-500">{quiz.question_count} questions</p>
                      </div>
                      <Button variant="primary" onClick={() => handleTakeQuiz(quiz)}>
                        Take Quiz
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {activeTab === 'take' && selectedQuiz && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">{selectedQuiz.title}</h2>
            <p className="text-sm text-gray-600">{selectedQuiz.sop_title}</p>
          </CardHeader>
          <CardBody>
            {quizSubmitted && lastResult ? (
              <div className="space-y-6">
                <div className="text-center py-8">
                  <div className="text-4xl font-bold mb-2">{lastResult.percentage}%</div>
                  <div className={`text-2xl font-semibold ${getScoreColor(lastResult.percentage)}`}>
                    {lastResult.percentage >= 70 ? 'Passed' : 'Failed'}
                  </div>
                  <p className="text-gray-600 mt-2">
                    {lastResult.score} / {lastResult.total_questions} correct
                  </p>
                </div>
                <div className="space-y-4">
                  {selectedQuiz.questions.map((q, i) => (
                    <div key={i} className={`p-4 rounded-lg ${currentAnswers[i] === q.correct_answer ? 'bg-green-50' : 'bg-red-50'}`}>
                      <p className="font-medium mb-2">{q.question}</p>
                      <div className="space-y-2">
                        {q.options.map((opt, optIndex) => (
                          <div
                            key={optIndex}
                            className={`p-2 rounded ${
                              currentAnswers[i] === optIndex
                                ? optIndex === q.correct_answer
                                  ? 'bg-green-200'
                                  : 'bg-red-200'
                                : optIndex === q.correct_answer
                                  ? 'bg-green-100'
                                  : 'bg-gray-50'
                            }`}
                          >
                            {opt}
                            {optIndex === q.correct_answer && ' ✓'}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="primary" onClick={() => setActiveTab('list')}>
                  Back to Quizzes
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {selectedQuiz.questions.map((q, i) => (
                  <div key={i} className="p-4 border rounded-lg">
                    <p className="font-medium mb-3">{i + 1}. {q.question}</p>
                    <div className="space-y-2">
                      {q.options.map((opt, optIndex) => (
                        <label key={optIndex} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`question-${i}`}
                            value={optIndex}
                            checked={currentAnswers[i] === optIndex}
                            onChange={() => handleAnswerSelect(i, optIndex)}
                            className="w-4 h-4"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                <Button variant="primary" onClick={handleSubmitQuiz}>
                  Submit Quiz
                </Button>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {activeTab === 'results' && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">My Quiz Results</h2>
          </CardHeader>
          <CardBody>
            {myResults.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No quiz results yet</div>
            ) : (
              <Table
                columns={[
                  { key: 'quiz_title', header: 'Quiz' },
                  { key: 'sop_title', header: 'SOP' },
                  { key: 'score', header: 'Score', render: (_: any, row: QuizResult) => `${row.score}/${row.total_questions}` },
                  { key: 'percentage', header: 'Percentage', render: (value: number) => `${value}%` },
                  { key: 'completed_at', header: 'Date', render: (value: string) => new Date(value).toLocaleDateString() },
                ]}
                data={myResults}
              />
            )}
          </CardBody>
        </Card>
      )}

      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardBody>
                <div className="text-sm text-gray-600">Total Quizzes</div>
                <div className="text-3xl font-bold text-gray-900">{analytics.total_quizzes}</div>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <div className="text-sm text-gray-600">Total Attempts</div>
                <div className="text-3xl font-bold text-gray-900">{analytics.total_attempts}</div>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <div className="text-sm text-gray-600">Average Score</div>
                <div className="text-3xl font-bold text-ocean-600">{analytics.average_score}</div>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <div className="text-sm text-gray-600">Pass Rate</div>
                <div className="text-3xl font-bold text-green-600">{analytics.pass_rate}%</div>
              </CardBody>
            </Card>
          </div>

          {analytics.department_performance.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Department Performance</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  {analytics.department_performance.map((dept) => (
                    <div key={dept.department} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">{dept.department}</span>
                          <span className="text-sm text-gray-600">{dept.average_percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-ocean-600 h-2 rounded-full"
                            style={{ width: `${dept.average_percentage}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {dept.total_attempts} attempts
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Recent Results</h2>
            </CardHeader>
            <CardBody>
              <Table
                columns={[
                  { key: 'user', header: 'User' },
                  { key: 'quiz', header: 'Quiz' },
                  { key: 'score', header: 'Score' },
                  { key: 'percentage', header: 'Percentage', render: (value: number) => `${value}%` },
                  { key: 'completed_at', header: 'Date', render: (value: string) => new Date(value).toLocaleDateString() },
                ]}
                data={analytics.recent_results}
              />
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
};
