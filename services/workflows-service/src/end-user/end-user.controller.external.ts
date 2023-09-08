import { randomUUID } from 'crypto';
import { faker } from '@faker-js/faker';
import * as common from '@nestjs/common';
import { Param } from '@nestjs/common';
import * as swagger from '@nestjs/swagger';
import { plainToClass } from 'class-transformer';
import { Request } from 'express';

import { ApiNestedQuery } from '@/common/decorators/api-nested-query.decorator';
import * as errors from '../errors';
import * as nestAccessControl from 'nest-access-control';
import { EndUserCreateDto } from './dtos/end-user-create';
import { EndUserFindManyArgs } from './dtos/end-user-find-many-args';
import { EndUserWhereUniqueInput } from './dtos/end-user-where-unique-input';
import { EndUserModel } from './end-user.model';
import { EndUserService } from './end-user.service';
import { isRecordNotFoundError } from '@/prisma/prisma.util';
import { UseKeyAuthInDevGuard } from '@/common/decorators/use-key-auth-in-dev-guard.decorator';
import { WorkflowDefinitionModel } from '@/workflow/workflow-definition.model';
import { WorkflowDefinitionFindManyArgs } from '@/workflow/dtos/workflow-definition-find-many-args';
import { WorkflowService } from '@/workflow/workflow.service';
import { makeFullWorkflow } from '@/workflow/utils/make-full-workflow';
import { Public } from '@/common/decorators/public.decorator';
import { DemoGuard } from '@/common/guards/demo.guard';

@swagger.ApiTags('external/end-users')
@common.Controller('external/end-users')
export class EndUserControllerExternal {
  constructor(
    protected readonly service: EndUserService,
    protected readonly workflowService: WorkflowService,
    @nestAccessControl.InjectRolesBuilder()
    protected readonly rolesBuilder: nestAccessControl.RolesBuilder,
  ) {}

  @common.Post()
  @swagger.ApiCreatedResponse({ type: [EndUserModel] })
  @swagger.ApiForbiddenResponse()
  @UseKeyAuthInDevGuard()
  async create(
    @common.Body() data: EndUserCreateDto,
  ): Promise<Pick<EndUserModel, 'id' | 'firstName' | 'lastName' | 'avatarUrl' | 'correlationId'>> {
    return this.service.create({
      data: {
        ...data,
        correlationId: data.correlationId || randomUUID(),
        email: data.email || faker.internet.email(data.firstName, data.lastName),
        phone: data.phone || faker.phone.number('+##########'),
        dateOfBirth: data.dateOfBirth || faker.date.past(60),
        avatarUrl: data.avatarUrl || faker.image.avatar(),
      },
      select: {
        id: true,
        correlationId: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
      },
    });
  }

  @common.Post('/create-with-business')
  @UseKeyAuthInDevGuard()
  async createWithBusiness(@common.Body() data: EndUserCreateDto) {
    const endUser = await this.service.createWithBusiness(data);

    return {
      endUserId: endUser.id,
      businessId: endUser.businesses.at(-1)!.id,
    };
  }

  @common.Get()
  @swagger.ApiOkResponse({ type: [EndUserModel] })
  @swagger.ApiForbiddenResponse()
  @ApiNestedQuery(EndUserFindManyArgs)
  async list(@common.Req() request: Request): Promise<EndUserModel[]> {
    const args = plainToClass(EndUserFindManyArgs, request.query);
    return this.service.list(args);
  }

  @common.Get(':id')
  @swagger.ApiOkResponse({ type: EndUserModel })
  @swagger.ApiNotFoundResponse({ type: errors.NotFoundException })
  @swagger.ApiForbiddenResponse()
  @UseKeyAuthInDevGuard()
  async getById(@common.Param() params: EndUserWhereUniqueInput): Promise<EndUserModel | null> {
    try {
      const endUser = await this.service.getById(params.id);

      return endUser;
    } catch (err) {
      if (isRecordNotFoundError(err)) {
        throw new errors.NotFoundException(`No resource was found for ${JSON.stringify(params)}`);
      }

      throw err;
    }
  }

  // curl -v http://localhost:3000/api/v1/external/end-users/:endUserId/workflows
  @common.Get('/:endUserId/workflows')
  @swagger.ApiOkResponse({ type: [WorkflowDefinitionModel] })
  @swagger.ApiForbiddenResponse({ type: errors.ForbiddenException })
  @common.HttpCode(200)
  @ApiNestedQuery(WorkflowDefinitionFindManyArgs)
  @UseKeyAuthInDevGuard()
  async listWorkflowRuntimeDataByEndUserId(@Param('endUserId') endUserId: string) {
    const workflowRuntimeDataWithDefinition =
      await this.workflowService.listFullWorkflowDataByUserId({
        entityId: endUserId,
        entity: 'endUser',
      });

    return makeFullWorkflow(workflowRuntimeDataWithDefinition);
  }
}
