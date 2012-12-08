var chai = require('chai')
  , assert = chai.assert
  , async = require('async')
  , crypto = require('crypto')
  , fs = require('fs')
  , pg = require('pg')
  , config = require('../config.js')
  , preparationPath = './test_files/preparation'
  , codeFileName = 'a+b.c'
  , codeLanguage = 1
  , specialJudgeCodeFileName = 'a+b.cc'
  , specialJudgeCodeLanguage = 2
  , dataSet = null
  , testcaseFileNames = null
  , Queue = require('../lib/Queue')
  , Map = require('../lib/Map');

exports.assertError = function(msg, fn) {
  var args = Array.prototype.slice.call(arguments, 2);
  try {
    fn.apply(null, args);
    throw new chai.AssertionError();
  } catch (err) {
    assert.strictEqual(msg, err.message);
  }
};

function hashFile(path, callback) {
  var rs = fs.ReadStream(path)
    , md5sum = crypto.createHash('md5')
    , shasum = crypto.createHash('sha1');

  rs.on('error', function(err) {
    callback(err);
  });

  rs.on('data', function(data) {
    md5sum.update(data);
    shasum.update(data);
  });

  rs.on('end', function() {
    var md5 = md5sum.digest('hex')
      , sha1 = shasum.digest('hex');

    fs.stat(path, function(err, stats) {
      if (err) {
        return callback(err);
      }

      var size = stats.size;
      callback(null, {size: size, md5: md5, sha1: sha1});
    });
    
  }); 
}

function copyFile(path, callback) {
  fs.readFile(path.source, function(err, data) {
    if (err) {
      return callback(err);
    }

    fs.writeFile(path.target, data, function(err) {
      if (err) {
        return callback(err);
      }

      callback(null, data);
    });
  });
}

function getCodeFileInformation(callback) {
  hashFile(preparationPath + '/' + codeFileName, function(err, result) {
    if (err) {
      return callback(err);
    }

    dataSet.codeFileSize = result.size;
    dataSet.codeFileMd5 = result.md5;
    dataSet.codeFileSha1 = result.sha1;
    dataSet.codeLanguage = codeLanguage;
    callback(null);
  });
}

function addUser(callback) {
  pg.connect(config.databaseConfig, function(err, db) {
    if (err) {
      return callback(err);
    }

    db.query('INSERT INTO zj_user (email, pass, nickname) VALUES ($1, $2, $3) RETURNING id', 
      ['a@zj.guts.me', '123456', 'nick'], function(err, result) {
        if (err) {
          return callback(err);
        }

        dataSet.userId = result.rows[0].id;
        callback(null);
      });
  });
}

function addProblem(callback) {
  pg.connect(config.databaseConfig, function(err, db) {
    if (err) {
      return callback(err);
    }

    db.query('INSERT INTO zj_problem (title, description, base_name, time_limit, memory_limit) '
      + 'VALUES ($1, $2, $3, $4, $5) RETURNING id', ['a+b', 'calculate a plus b.', 'aplusb', 1, 64], 
      function(err, result) {
        if (err) {
          return callback(err);
        }

        dataSet.problemId = result.rows[0].id;
        callback(null);
      });
  });
}


function addSubmission(callback) {
  pg.connect(config.databaseConfig, function(err, db) {
    if (err) {
      return callback(err);
    }

    db.query('INSERT INTO zj_submission (user_id, problem_id, submit_date, code_language, code_file_size, '
      + 'code_file_md5, code_file_sha1, use_file_io) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id', 
      [dataSet.userId, dataSet.problemId, new Date(), dataSet.codeLanguage, dataSet.codeFileSize, 
      dataSet.codeFileMd5, dataSet.codeFileSha1, false], function(err, result) {
        if (err) {
          return callback(err);
        }
        
        dataSet.submissionId = result.rows[0].id;
        callback(null);
      });
  });
}

function addCodeFile(callback) {
  copyFile({source: preparationPath + '/' + codeFileName, target: config.userCodePath + '/' + dataSet.submissionId}, 
    function(err, data) {
      if (err) {
        return callback(err);
      }

      dataSet.codeFile = data.toString('utf8');
      callback(null);
    });
}

function getTestcaseFilesInformation(callback) {
  var files = [];
  for(var i = 1; i <= 10; ++i) {
    var testcaseFileName = {inputFile: 'a+b.in' + i.toString(), answerFile: 'a+b.ans' + i.toString()};
    testcaseFileNames.push(testcaseFileName);
  }

  function getTestcaseFileInformation(testcaseFileName, callback) {
    async.map([preparationPath + '/' + testcaseFileName.inputFile, preparationPath + '/' + testcaseFileName.answerFile],
      hashFile, function(err, results) {
        if (err) {
          return callback(err);
        }

        callback(null, {inputFile: results[0], answerFile: results[1]});
      });
  };

  async.map(testcaseFileNames, getTestcaseFileInformation, function(err, results) {
    if (err) {
      return callback(err);
    }

    dataSet.testcases = [];
    for (var i = 0; i < results.length; ++i) {
      dataSet.testcases[i] = results[i];
    }
    callback(null);
  });
}

function addTestcases(callback) {
  for(var i = 0; i < dataSet.testcases.length; ++i) {
    dataSet.testcases[i].weight = i + 1;
  }

  pg.connect(config.databaseConfig, function(err, db) {
    if (err) {
      return callback(err);
    }

    function addTestcase(testcase, callback) {
      db.query('INSERT INTO zj_testcase (problem_id, weight, input_file_size, input_file_md5, input_file_sha1, '
        + 'answer_file_size, answer_file_md5, answer_file_sha1) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id', 
        [dataSet.problemId, testcase.weight, testcase.inputFile.size, testcase.inputFile.md5, testcase.inputFile.sha1, 
        testcase.answerFile.size, testcase.answerFile.md5, testcase.answerFile.sha1], function(err, result) {
          if (err) {
            return callback(err);
          }

          testcase.id = result.rows[0].id;
          callback(null, testcase);
        });
    }

    db.pauseDrain();
    async.map(dataSet.testcases, addTestcase, function(err, results) {
      if (err) {
        db.resumeDrain();
        return callback(err);
      }

      for (var i = 0; i < results.length; ++i) {
        dataSet.testcases[i] = results[i];
      }

      callback(null);
    });
  });
}

function addTestcaseFiles(callback) {
  for (var i = 0; i < dataSet.testcases.length; ++i) {
    dataSet.testcases[i].inputFile.name = testcaseFileNames[i].inputFile;
    dataSet.testcases[i].answerFile.name = testcaseFileNames[i].answerFile;
  }

  function addTestcaseFile(testcase, callback) {
    var inputFilePath = {source: preparationPath + '/' + testcase.inputFile.name, 
      target: config.testDataPath + '/' + testcase.id + '.in'};
    var answerFilePath = {source: preparationPath + '/' + testcase.answerFile.name, 
      target: config.testDataPath + '/' + testcase.id + '.ans'};

    async.map([inputFilePath, answerFilePath], copyFile, function(err, results) {
      if (err) {
        return callback(err);
      }

      testcase.inputFile.content = results[0].toString('utf8');
      testcase.answerFile.content = results[1].toString('utf8');
      callback(null, testcase);
    });
  }

  async.map(dataSet.testcases, addTestcaseFile, function(err, results) {
    if (err) {
      return callback(err);
    }

    for (var i = 0; i < results.length; ++i) {
      dataSet.testcases[i] = results[i];
      delete dataSet.testcases[i].inputFile.name;
      delete dataSet.testcases[i].answerFile.name;
    }

    callback(null);
  });
}

function getSpecialJudgeCodeFileInformation(callback) {
  hashFile(preparationPath + '/' + specialJudgeCodeFileName, function(err, result) {
    if (err) {
      return callback(err);
    }

    dataSet.specialJudgeCodeFileSize = result.size;
    dataSet.specialJudgeCodeFileMd5 = result.md5;
    dataSet.specialJudgeCodeFileSha1 = result.sha1;
    dataSet.specialJudgeCodeLanguage = specialJudgeCodeLanguage;
    callback(null);
  });
}

function addSpecialJudge(callback) {
  pg.connect(config.databaseConfig, function(err, db) {
    if (err) {
      return callback(err);
    }

    db.query('INSERT INTO zj_special_judge (problem_id, description, code_language, code_file_size, code_file_md5, '
      + 'code_file_sha1) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id', 
      [dataSet.problemId, 'desc', dataSet.specialJudgeCodeLanguage, dataSet.specialJudgeCodeFileSize, 
      dataSet.specialJudgeCodeFileMd5, dataSet.specialJudgeCodeFileSha1], function(err, result) {
        if (err) {
          return callback(err);
        }
        
        dataSet.specialJudgeId = result.rows[0].id;
        callback(null);
      });
  });
}

function addSpecialJudgeCodeFile(callback) {
  copyFile({source: preparationPath + '/' + specialJudgeCodeFileName, 
    target: config.specialJudgeCodePath + '/' + dataSet.specialJudgeId}, function(err, data) {
      if (err) {
        return callback(err);
      }

      dataSet.specialJudgeCodeFile = data.toString('utf8');
      callback(null);
    });
}

function generateResultJson(callback) {
  dataSet.result = {};
  dataSet.result.submission_id = dataSet.submissionId;
  dataSet.result.compile_passed = true;
  dataSet.result.compiler_message = 'COMPILER MESSAGE';

  dataSet.result.test_results = [];
  for (var i = 0; i < dataSet.testcases.length; ++i) {
    dataSet.result.test_results[i] = {};
    dataSet.result.test_results[i].testcase_id = dataSet.testcases[i].id;
  }

  dataSet.result.test_results[0].status = 'tle';
  dataSet.result.test_results[0].details = null;
  dataSet.result.test_results[0].score = 0;
  dataSet.result.test_results[0].time_used = 1007;
  dataSet.result.test_results[0].memory_used = 280;

  dataSet.result.test_results[1].status = 'mle';
  dataSet.result.test_results[1].details = null;
  dataSet.result.test_results[1].score = 0;
  dataSet.result.test_results[1].time_used = 0;
  dataSet.result.test_results[1].memory_used = 284;

  dataSet.result.test_results[2].status = 'ole';
  dataSet.result.test_results[2].details = null;
  dataSet.result.test_results[2].score = 0;
  dataSet.result.test_results[2].time_used = 59;
  dataSet.result.test_results[2].memory_used = 280;

  dataSet.result.test_results[3].status = 're';
  dataSet.result.test_results[3].details = 'SIGSEGV';
  dataSet.result.test_results[3].score = 0;
  dataSet.result.test_results[3].time_used = 0;
  dataSet.result.test_results[3].memory_used = 284;

  dataSet.result.test_results[4].status = 'rf';
  dataSet.result.test_results[4].details = 'sys_clone';
  dataSet.result.test_results[4].score = 0;
  dataSet.result.test_results[4].time_used = 1007;
  dataSet.result.test_results[4].memory_used = 280;

  dataSet.result.test_results[5].status = 'ac';
  dataSet.result.test_results[5].details = null;
  dataSet.result.test_results[5].score = dataSet.testcases[5].weight;
  dataSet.result.test_results[5].time_used = 275;
  dataSet.result.test_results[5].memory_used = 284;

  dataSet.result.test_results[6].status = 'pe';
  dataSet.result.test_results[6].details = null;
  dataSet.result.test_results[6].score = 0;
  dataSet.result.test_results[6].time_used = 275;
  dataSet.result.test_results[6].memory_used = 284;

  dataSet.result.test_results[7].status = 'wa';
  dataSet.result.test_results[7].details = null;
  dataSet.result.test_results[7].score = 0;
  dataSet.result.test_results[7].time_used = 275;
  dataSet.result.test_results[7].memory_used = 284;

  dataSet.result.test_results[8].status = 'sj';
  dataSet.result.test_results[8].details = 'special judge comment';
  dataSet.result.test_results[8].score = dataSet.testcases[8].weight;
  dataSet.result.test_results[8].time_used = 275;
  dataSet.result.test_results[8].memory_used = 280;

  dataSet.result.test_results[9].status = 'sj';
  dataSet.result.test_results[9].details = 'special judge comment 2';
  dataSet.result.test_results[9].score = dataSet.testcases[9].weight - 2;
  dataSet.result.test_results[9].time_used = 275;
  dataSet.result.test_results[9].memory_used = 284;

  callback(null);
}

exports.prepareData = function(callback) {
  testcaseFileNames = [];
  dataSet = {};
  async.series([getCodeFileInformation, addUser, addProblem, addSubmission, addCodeFile, getTestcaseFilesInformation,
    addTestcases, addTestcaseFiles, getSpecialJudgeCodeFileInformation, addSpecialJudge, addSpecialJudgeCodeFile,
    generateResultJson], 
    function(err) {
      if (err) {
        return callback(err);
      }

      callback(null, dataSet);
    });
};

function clearTable(tableName, callback) {
  pg.connect(config.databaseConfig, function(err, db) {
    if (err) {
      return callback(err);
    }

    db.query('DELETE FROM ' + tableName, callback);
  });
}

function deleteFiles(dir, callback) {
  var deleteFile = function(path, callback) {
    fs.unlink(dir + '/' + path, callback);
  }

  fs.readdir(dir, function(err, files) {
    if (err) {
      return callback(err);
    }

    async.forEach(files, deleteFile, callback);
  });
}

exports.clearData = function(callback) {
  function task1(callback) {
    async.forEachSeries(['zj_test_result', 'zj_special_judge', 'zj_testcase','zj_submission', 'zj_problem', 'zj_user'], 
      clearTable, callback);
  }

  function task2(callback) {
    async.forEachSeries([config.userCodePath, config.testDataPath, config.specialJudgeCodePath], deleteFiles, 
      callback);
  }

  async.series([task1, task2], callback);
};

exports.deleteSpecialJudge = function(callback) {
  clearTable('zj_special_judge', function(err) {
    if (err) {
      return callback(err);
    }

    fs.unlink(config.specialJudgeCodePath + '/' + dataSet.specialJudgeId, callback);
  });
};

function populateJudgedSubmissionById(submissionId, callback) {
  pg.connect(config.databaseConfig, function(err, db) {
    if (err) {
      return callback(err);
    }

    db.query('SELECT compile_passed, compiler_message FROM zj_submission WHERE id=$1', [submissionId], 
      function(err, result) {
        if (err) {
          return callback(err);
        }
        
        callback(null, result.rows[0]);
      });
  });
}

function populateTestResultsBySubmissionId(submissionId, callback) {
  pg.connect(config.databaseConfig, function(err, db) {
    if (err) {
      return callback(err);
    }

    db.query('SELECT * FROM zj_test_result WHERE submission_id=$1', [submissionId], function(err, result) {
      if (err) {
        return callback(err);
      }
      
      var testResults = result.rows;
      for (var i = 0; i < testResults.length; ++i) {
        delete testResults[i]['id'];
      }
      callback(null, testResults);
    });
  });
}

exports.populateJudgeResult = function(submissionId, callback) {
  async.parallel({
    submission: function(callback) {
      populateJudgedSubmissionById(submissionId, callback);
    },
    testResults: function(callback) {
      populateTestResultsBySubmissionId(submissionId, callback);
    }
  }, callback);
};

exports.resetConfig = function() {
  config.databaseConfig.user = 'postgres';
  config.databaseConfig.password = 'postgres';
  config.databaseConfig.database = 'test';
  config.databaseConfig.host = 'localhost';
  config.databaseConfig.port = 5432;

  config.userCodePath = './test_files/code';
  config.testDataPath = './test_files/data';
  config.specialJudgeCodePath = './test_files/sjcode';

  config.tasks = new Queue();
  config.retryTasks = new Queue();

  config.producers = new Map();
  config.consumers = new Map();
};