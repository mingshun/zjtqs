PROJECT_DIR=$(shell pwd)
REPORTER=spec
TIMEOUT=10s
SLOW=7s
UI=tdd
JSCOVERAGE=./node_modules/jscoverage/jscoverage
JSHINT=./node_modules/jshint/bin/hint

BEFORE_TEST=mkdir -p $(PROJECT_DIR)/logs $(PROJECT_DIR)/test_files/code $(PROJECT_DIR)/test_files/data $(PROJECT_DIR)/test_files/sjcode


test:
	@$(BEFORE_TEST)
	@NODE_ENV=test $(PROJECT_DIR)/node_modules/mocha/bin/mocha \
		--reporter $(REPORTER) \
		--timeout $(TIMEOUT) \
		--slow $(SLOW) \
		--ui $(UI) 

test-cov: 
	@$(BEFORE_TEST)
	@rm -rf $(PROJECT_DIR)/../zjtqs-cov
	@$(JSCOVERAGE) --encoding=utf-8 --exclude=node_modules --exclude=test --exclude=test_files $(PROJECT_DIR) $(PROJECT_DIR)/../zjtqs-cov
	@cp -rf $(PROJECT_DIR)/node_modules $(PROJECT_DIR)/test $(PROJECT_DIR)/test_files $(PROJECT_DIR)/../zjtqs-cov
	@$(MAKE) -C $(PROJECT_DIR)/../zjtqs-cov test REPORTER=dot
	@$(MAKE) -C $(PROJECT_DIR)/../zjtqs-cov test REPORTER=html-cov > $(PROJECT_DIR)/coverage.html
	@rm -rf $(PROJECT_DIR)/../zjtqs-cov

jshint:
	@$(JSHINT) $(PROJECT_DIR) > $(PROJECT_DIR)/jshint-report.txt

clean:
	@rm -f $(PROJECT_DIR)/coverage.html
	@rm -f $(PROJECT_DIR)/jshint-report.txt
	@rm -rf $(PROJECT_DIR)/logs/*

.PHONY: test test-cov clean
