#include <iostream>
#include <fstream>
#include <cstdlib>
#include <cstdio>

using namespace std;

int str2num(const char *s, int *value)
{
  if (s == NULL) {
    return -1;
  }

  int result = 0;
  int negative = 0;
  int i = 0, len = strlen(s);
  int limit = -INT_MAX;
  int min;
  int digit;

  if (len > 0) {
    char first_char = s[0];
    if (first_char < '0') { // 可能是“+”或“-”开头
      if (first_char == '-') {
        negative = 1;
        limit = INT_MIN;
      } else if (first_char != '+') {
        return -1;
      }
      if (len == 1) { // 不能只有“+”或“-”
        return -1;
      }
      i++;
    }
    min = limit / 10;
    while (i < len) {
      // 以负数累加，避免在INT_MAX附近出错
      digit = charactor_to_digit(s[i++]);
      if (digit < 0) {
        return -1;
      }
      if (result < min) {
        return -1;
      }
      result *= 10;
      if (result < limit +digit) {
        return -1;
      }
      result -= digit;
    }
  } else {
    return -1;
  }
  *value = negative == 1 ? result : -result;
  return 0;
}

int main(int argc, char* argv[])
{
  if (argc != 5) {
    exit(EXIT_FAILURE);
  }

  const char* input_path = argv[1];
  const char* answer_path = argv[2];
  const char* output_path = argv[3];
  int weight;
  if (str2num(argv[4], &weight) == -1) {
    return EXIT_FAILURE;
  }

  ifstream input_stream(input_path, ifstream::in);
  ifstream answer_stream(answer_path, ifstream::in);
  ifstream output_stream(output_path, ifstream::in);

  int answer;
  answer_stream >> answer;
  int output;
  output_stream >> output;
  if (!output_stream.good()) {
    cout << "{\"score\":0,\"details\":\"invalid fotmat\"}";
  }
  if (answer == output) {
    cout << cout << "{\"score\":" << weight << ",\"details\":\"correct answer\"}";;
  } else {
    cout << "{\"score\":0,\"details\":\"wrong answer\"}";
  }

  input_stream.close();
  answer_stream.close();
  output_stream.close();

  return EXIT_SUCCESS;
}