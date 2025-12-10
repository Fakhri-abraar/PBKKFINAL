import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesModule } from './categories.module';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

describe('CategoriesModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [CategoriesModule],
    }).compile();
  });

  it('should compile the module', () => {
    expect(module).toBeDefined();
  });

  it('should resolve CategoriesController', () => {
    const controller = module.get<CategoriesController>(CategoriesController);
    expect(controller).toBeDefined();
  });

  it('should resolve CategoriesService', () => {
    const service = module.get<CategoriesService>(CategoriesService);
    expect(service).toBeDefined();
  });
});