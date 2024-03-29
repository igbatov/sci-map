const {getTextChangePercent} = require("./helpers");

const percent = getTextChangePercent(`Perceptron is the simplest artificial neural network with one layer and in fact is the same as linear regression except its out goes through activation function

**Sources**

[Video: L5.2 Relation Between Perceptron and Linear Regression
](https://www.youtube.com/watch?v=4JB1j8eIGzI&t=70s)`,
  `Perceptron is the simplest artificial neural network with one layer and in fact is just the linear regression with its output going through activation function that takes number $x$ as argument and spits $0$ if x is below threshold or $1$ if above.

Written in a formula:

![](https://cdn.scimap.org/user/BBQjmUOwgrafwOLM5ph7R4w52Nz1/image/1711266227450.svg)

Where f(x) is

![](https://cdn.scimap.org/user/BBQjmUOwgrafwOLM5ph7R4w52Nz1/image/1711265584818.svg =100x)

![](https://cdn.scimap.org/user/BBQjmUOwgrafwOLM5ph7R4w52Nz1/image/1711265590368.svg =150x)

Perceptron can also be viewed as a simple model of single neuron of human brain (and in fact was inspired by discover of neuron structure).

We also have evidence that neuron connections changes its strength (like perceptron model changes its weight) during learning process. However there is no single theory describing how learning process really goes in a brain and if it is similar to any kind of artificial network learning algorithm (like "gradient descending") (see [Hebbian theory](https://en.wikipedia.org/wiki/Hebbian_theory))

**Sources**

[Video: L5.2 Relation Between Perceptron and Linear Regression
](https://www.youtube.com/watch?v=4JB1j8eIGzI&t=70s)

[Wikipedia: Hebbian theory](https://en.wikipedia.org/wiki/Hebbian_theory)`)

console.log(percent)
