/**
 * Based off of https:// github.com/nathanpeck/standard-deviation-stream
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2014 Nathan Peck
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
*/
export default class StandardDeviationStream {

  constructor() {
    this.newMean = 0;
    this.newVariance = 0;
    this.oldMean = 0;
    this.oldVariance = 0;
    this.currentMin = 0;
    this.currentMax = 0;

    this.valueCount = 0;
  }

  // Push a new value into the stream.
  push(incomingNumber) {
    this.valueCount++;
    if (this.valueCount === 1) {
      this.oldMean =
      this.newMean =
      this.currentMin =
      this.currentMax = incomingNumber;
      this.oldVariance = 0;
    } else {
      this.newMean = this.oldMean + (incomingNumber - this.oldMean) / this.valueCount;
      this.newVariance = this.oldVariance +
        (incomingNumber - this.oldMean) *
        (incomingNumber - this.newMean);
      this.oldMean = this.newMean;
      this.oldVariance = this.newVariance;
      this.currentMin = Math.min(this.currentMin, incomingNumber);
      this.currentMax = Math.max(this.currentMax, incomingNumber);
    }
  }

  // Clear the stream's state.
  clear() {
    this.valueCount = 0;
    this.newMean = 0;
    this.oldMean = 0;
    this.newVariance = 0;
    this.oldVariance = 0;
    this.currentMin = 0;
    this.currentMax = 0;
  }

  // How many items have we pushed in?
  count() {
    return this.valueCount;
  }

  // What is the average of the items we've put in?
  mean() {
    return (this.valueCount > 0) ? this.newMean : 0;
  }

  // What is the variance of the items?
  variance() {
    return ((this.valueCount > 1) ? this.newVariance / (this.valueCount - 1) : 0.0);
  }

  // What is the standard deviation of the items?s
  standardDeviation() {
    return Math.sqrt(this.variance());
  }

  //  Get the minimum value
  min() {
    return this.currentMin;
  }

  //  Get the maximum value
  max() {
    return this.currentMax;
  }
}
