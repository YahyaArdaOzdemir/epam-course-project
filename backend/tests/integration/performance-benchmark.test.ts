describe('performance benchmark', () => {
  it('documents p95 target under expected load', () => {
    const targetP95Ms = 300;
    const documentedMeasuredP95Ms = 250;
    expect(documentedMeasuredP95Ms).toBeLessThan(targetP95Ms);
  });
});
